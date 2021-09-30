addEventListener("fetch", (event) => {
    event.respondWith(
        handleRequest(event.request).catch(
            (err) => new Response(err.stack, { status: 500 })
        )
    );
});


// Send a json response
async function jsonify(json) {
    return new Response(JSON.stringify(json), {
        headers: { 'content-type': 'application/json' }
    })
}

// Return a content(text) message only 
function sendContent (msg) {
    return new Response(JSON.stringify({
        type: 4,
        data: {
            tts: false,
            content: msg,
            embeds: [],
            allowed_mentions: { parse: [] }
        }
    }), { headers: {'content-type': 'application/json'} })
}

// Return 1 embedded message only
function sendEmbed (obj) {
    return new Response(JSON.stringify({
        type: 4,
        data: {
            tts: false,
            content: null,
            embeds: [obj],
            allowed_mentions: { parse: [] }
        }
    }), { headers: {'content-type': 'application/json'} })
}

async function handleRequest(request) {
    const { pathname } = new URL(request.url);

    // Handel the interactions from discord
    if (pathname === "/api/interactions" && request.method == "POST") {
        const body = await request.text();
        // Code From https://github.com/ImPlotzes/Discord-Slash-Commands/
        // Get the request signature and timestamp
        const signature = request.headers.get("X-Signature-Ed25519");
        const timestamp = request.headers.get("X-Signature-Timestamp");
    
        // Respond with status 401 (as per Discord's docs) if there isn't a signature or timestamp
        if(!signature || !timestamp) {
            return new Response("{\"error\":\"401 - UNAUTHORIZED\",\"reason\":\"No signature or timestamp provided.\"}", {status: 401});
        }
    
        // Turn the public key key (at this point a string) into a CryptoKey object
        const key = await crypto.subtle.importKey(
            "raw",
            toBuffer(PUBLIC_KEY, true), 
            { name: "NODE-ED25519", namedCurve: "NODE-ED25519" }, 
            false, 
            ["verify"]
        );
        
        // Verify the signature/message to make sure it came from Discord itself
        const isVerified = await crypto.subtle.verify(
            "NODE-ED25519",
            key,
            toBuffer(signature, true),
            toBuffer(timestamp + body, false)
        );
    
        if (!isVerified) {
            return new Response("Invalid request signature", { status: 401 })
        } else {
            return await handleInteraction(bodyJson);
        }
    };


    if (pathname === '/commands/get') {
        // Get a full list of all your global commands
        const req = await fetch(`https://discord.com/api/v8/applications/${ClientID}/commands`, {
            headers: { 'Content-Type': 'application/json', "Authorization": Auth },
        })
        const commands = await req.text();
        return new Response(commands, { status: req.status, headers: { 'Content-Type': 'application/json' } })
    }


    if (pathname === "/commands/setup") {
        // Note command names can only be lowercase
        // Payload ref: https://discord.com/developers/docs/interactions/application-commands#making-a-global-command 
        payload = [
            {
                name: "ping",
                type: 1,
                description: "Send the classic ping command"
            },
            {
                name: "me",
                type: 1,
                description: "Send what the bot can see about you"
            }
        ]

        let req = await fetch(`https://discord.com/api/v8/applications/${ClientID}/commands`, {
            method: "PUT", // USE POST for individual commands, and remove from array
            headers: { 'Content-Type': 'application/json', "Authorization": Auth },
            body: JSON.stringify(payload)
        })

        return new Response(await req.text(), { status: req.status })
    }

    return new Response(null, { status: 404 });
}



// Handel the interaction requests from discord
async function handleInteraction(request) {
    const type = request.type;
    // See https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type for the request(interaction) types
    if (type == 1) {
        return jsonify({ type: 1 });
    };    

    if (type == 2) {
        const data = request.data;
        const command = data.name;
        const options = data.options;
        const member = request.member;
        
        // Handel your commands here
        if (command === 'ping') {
            return sendContent("Pong")
        };
        if (command === 'me') {
            return sendEmbed({
                title: `${member.user.username}#${member.user.discriminator}`,
                description: JSON.stringify(member),
                thumbnail: {
                    url: `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}`
                }
            })
        }
    }

    return new Response(null, { status: 404 })
}




// If you want to run any scheduled events with CRON 
addEventListener('scheduled', event => {
    event.waitUntil(
        handleSchedule(event.scheduledTime)
    )
})

async function handleSchedule(scheduledDate) {
    console.log(scheduledDate)
};







// Create a buffer from a (hex)string
// Used for request signature verification since the key, signature and request body need to be buffers
function toBuffer(string, hex) {
    if(hex) {
        const buffer = new ArrayBuffer(string.length / 2);
        const data = new DataView(buffer);

        for(let i = 0; i < string.length; i += 2) {
            data.setUint8(i / 2, parseInt(string.substr(i, 2), 16));
        }
        return data;
    } else {
        const encoder = new TextEncoder();
        return encoder.encode(string);
    }
}
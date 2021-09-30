var Buffer = require("./src/buffer");
var nacl = require("./src/nacl");

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
async function sendContent(msg) {
    return new Response(JSON.stringify({
        type: 4,
        data: {
            tts: false,
            content: msg
        }
    }), { headers: { 'content-type': 'application/json' } })
}

// Return 1 embedded message only
async function sendEmbed(obj) {
    return new Response(JSON.stringify({
        type: 4,
        data: {
            tts: false,
            embeds: [obj]
        }
    }), { headers: { 'content-type': 'application/json' } })
}


async function handleRequest(request) {
    const { pathname } = new URL(request.url);

    // Handel the interactions from discord
    if (pathname === "/api/interactions" && request.method == "POST") {
        const signature = request.headers.get("X-Signature-Ed25519");   // Request headers for verifying
        const timestamp = request.headers.get("X-Signature-Timestamp"); // ^
        let body = await request.text(); // Get the raw text from the body
        let bodyJson = JSON.parse(body); // Parse the body for json
        
        // Make sure we have the headers to verify
        if (!signature || !timestamp) return new Response("missing X-Signature headers", { status: 400 })
        
        // We need to verify the request is coming from discord, and not someone else.
        const isVerified = nacl.sign.detached.verify(
            Buffer.from(timestamp + body),
            Buffer.from(signature, "hex"),
            Buffer.from(PublicKey, "hex")
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
        payload = {
        }

        let req = await fetch(`https://discord.com/api/v8/applications/${ClientID}/commands`, {
            method: "PATCH",
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
    if (request.type == 1) {
        return jsonify({ type: 1 });
    };    

    if (request.type == 2) {
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
                type: "rich",
                title: `${member.user.username}#${member.user.discriminator}`,
                description: json.stringify(member),
                color: 0xffffff,
                timestamp: member.joined_at,
                thumbnail: {
                    url: member.user.avatar
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
# Cloudflare Discord Http Bot
This is a Discord bot that can run completely on Cloudflare workers, using Discord interactions endpoint.

Feel free to make any changes that can improve this script.

## Some Helpful Links 

[Application Command Option Type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type)
The type of inputs for a command, e.g. String, Number, User, Channel, Roles, etc...

[Interaction Type](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type)
The different types of interactions that will be requested  


## How to use
### Configure the `wrangler.toml` file
```toml
# The Name of the Cloudflare worker
name = "http-discord-bot" 

type = "javascript"
# Your Cloudflare account ID
account_id = ""

workers_dev = true

[vars]

# Your Discord's client Public key
PublicKey = ""
# Your Discord's client ID
ClientID = ""
# Your Discord's client Bot Token.
Auth = "Bot YOUR_BOTS_TOKEN"  # Leave the `Bot ` at the start and just replace `YOUR_BOTS_TOKEN` with the token
# The version of your bot. If you want, you can reference this in the command response 
Version = "1.0.0"

# If you do use KV for something, you can uncomment this.
#[[kv_namespaces]]
#binding = "" # How you will get the namespace in the script
#preview_id = "" # Namespace id for testing
#id = "" # Namespace id for live
```
### Publish the code!
Make sure you have [wrangler](https://github.com/cloudflare/wrangler#readme) downloaded and are logged in.
```bash
$ wrangler publish
```
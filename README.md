# ModManager Webhook
Uses discord webhooks to send a message when a user makes a support request from the mod manager

Get the mod manager [here](https://github.com/sbcomputertech/modmanager)

If you want to run the project, create a `secrets.json` file, and add
```json
{
    "discord-webhooks": [
        "<Discord webhook 1>",
        "<Discord webhook 2>"
    ],
    "pastebin-apikey": "<Pastebin API key>"
}
```

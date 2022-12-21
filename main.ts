import supabase = require("@supabase/supabase-js")
import axios from "axios"
import fs = require("fs")
import FormData from 'form-data'

const secrets = JSON.parse(fs.readFileSync("secrets.json").toString())
const client = supabase.createClient("https://croiqlfjgofhokfrpagk.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb2lxbGZqZ29maG9rZnJwYWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjU3ODE3NDQsImV4cCI6MTk4MTM1Nzc0NH0.OBdI7jvIYdI1lwVqxJa41L4ASoQuCb6n3GKolwVYglA")

const ax = new axios.Axios({
    headers: {
        "Content-Type": "application/json"
    }
})

function send_to_webhooks(jsonMessage: string) {
    secrets["discord-webhooks"].forEach((hook_url: string) => {
        ax.post(hook_url, jsonMessage)
    })
}

function make_request_payload(subject: string, user: string, notes: string, log_link: string) : string {
    let data = {
        username: user + " | Support",
        embeds: [
            {
                title: subject,
                type: "rich",
                description: "User " + user + " submitted a support request at " + new Date().toUTCString(),
                color: 16711935,
                footer: {
                    text: "Help request made from Cobweb Mod Manager"
                },
                thumbnail: {
                    url: ""
                },
                fields: [
                    {
                        name: "Author",
                        value: user,
                        inline: true
                    },
                    {
                        name: "Log file",
                        value: log_link,
                        inline: true
                    },
                    {
                        name: "Additional notes",
                        value: notes,
                        inline: false
                    }
                ]
            }
        ]
    }
    return JSON.stringify(data)
}

async function make_request_payload_entry(entry: SupportEntry): Promise<string> {
    let logUrl;
    if(entry.logs == "no-log-sent") {
        logUrl = "No log file was sent"
    } else {
        logUrl = await upload_logs(entry.logs)
    }
    return make_request_payload(entry.subject, entry.discord_mention, entry.notes, logUrl)
}

async function upload_logs(logText: string): Promise<string> {
    let body = new FormData()
    body.append("api_dev_key", secrets["pastebin-apikey"])
    body.append("api_paste_code", logText)
    body.append("api_option", "paste")
    let resp = await ax.post("https://pastebin.com/api/api_post.php", body)
    let paste_url = resp.data as string
    console.log("Pastebin URL:", paste_url)
    return paste_url
}

interface SupportEntry {
    created_at: string,
    discord_mention: string,
    id: number,
    logs: string,
    notes: string,
    subject: string
}

function init_supabase_realtime() {
    client
        .channel('public:Support')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Support' }, payload => {
            var data = payload.new as SupportEntry;
            console.log('New support entry from postgres:', data)
            make_request_payload_entry(data).then(payload => {
                send_to_webhooks(payload)
            })
        })
        .subscribe()
}

console.log("loaded!")
init_supabase_realtime()

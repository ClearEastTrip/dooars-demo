# Turn on the usage log (about 10 minutes, free)

All in the Cloudflare dashboard. Nothing here touches the existing `dooars-chat` worker.

1. **Create the database:** Storage & Databases → D1 → Create → name it `godooars-log`.
2. **Create the worker:** Workers & Pages → Create → Worker → name it `godooars-log` → Deploy.
   Then Edit code, paste everything from `worker/log-worker.js`, and Deploy.
3. **Connect the database:** in the worker, open Settings → Bindings → Add → D1 database.
   Variable name `DB`, database `godooars-log`. Save.
4. **Set a password for the stats page:** Settings → Variables and Secrets → Add → type Secret,
   name `STATS_KEY`, value: any long password you choose. Save.
5. **Create the table once:** open `https://godooars-log.<your-subdomain>.workers.dev/setup?key=<STATS_KEY>`.
   It should say "table ready".
6. **Switch logging on in the chat:** in `app.js`, set
   `const LOG_URL='https://godooars-log.<your-subdomain>.workers.dev/';` and publish.
7. **See the numbers:** `https://godooars-log.<your-subdomain>.workers.dev/stats?key=<STATS_KEY>`

## QR codes per location

Print a separate QR for each place, with a tag at the end of the link:

- `https://cleareasttrip.github.io/dooars-demo/?src=lataguri-homestay`
- `https://cleareasttrip.github.io/dooars-demo/?src=murti-cafe`

The stats page then shows visits and questions for each tag.

## What is stored

Time, a random visit id, the QR tag, language, the question (phone numbers and the visitor's
name masked), whether it was answered, places mentioned, and country. Nothing typed into the
name or phone steps is stored. Pitch/demo links with `?demo` are never logged.

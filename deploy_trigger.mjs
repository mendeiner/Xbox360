// One-off script (not part of the build) — POSTs to this project's Vercel Deploy Hook so a
// `git push` is actually followed by a production deploy. Needed because this repo's Vercel
// <-> GitHub Git integration is connected but not currently auto-deploying on push (its `link`
// metadata reports `sourceless: true` — see CLAUDE.md's Deployment identifiers section for how
// this was diagnosed and what the real fix is). Reads the hook URL from `.launcher_config.json`
// (gitignored local config, same file launcher.py's "Deploy agora" button reads).
import { readFileSync } from 'fs'

const CONFIG_PATH = new URL('./.launcher_config.json', import.meta.url)

let config
try {
  config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
} catch {
  console.error('No .launcher_config.json found (or it has no deploy_hook_url). Create it with:\n  { "deploy_hook_url": "https://api.vercel.com/v1/integrations/deploy/..." }\nGet the URL from Vercel dashboard -> xbox360 project -> Settings -> Git -> Deploy Hooks.')
  process.exit(1)
}

const url = config.deploy_hook_url
if (!url) {
  console.error('.launcher_config.json has no deploy_hook_url set.')
  process.exit(1)
}

const res = await fetch(url, { method: 'POST' })
const body = await res.text()
console.log(`Deploy hook responded ${res.status}:`, body)
if (!res.ok) process.exit(1)

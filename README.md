# 📱 wa-digest

> Came back to 200 unread messages? Text yourself **`/summary`** and get the gist in 30 seconds.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)
![Runs](https://img.shields.io/badge/runs-phone%20%7C%20laptop%20%7C%20pi-blue.svg)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)

A privacy-first, self-hosted WhatsApp catch-up bot. It links to your WhatsApp like WhatsApp Web does, quietly notes what arrives while you're away, and when you ask, an AI writes you a short digest — **grouped by chat**. Messages live in memory only and are thrown away after each summary. No database, ever.

Use Claude, or a **100% free local model** (via Ollama) where your messages never even leave your computer.

> ⚠️ Not affiliated with WhatsApp or Meta. It uses an unofficial library, so there's some account risk — **use a spare number.** (See [the fine print](#️-the-fine-print).)

---

## 👀 What it looks like

You text yourself:

```
/summary 6
```

…and a few seconds later you get back:

```
Mom — wants you to call about Sunday lunch (now 1pm). Needs a reply.
Work group — deploy is tonight at 9; Priya asked if your PR is ready.
College squad — 40 msgs, mostly memes. Nothing for you.
Riya — sent trip photos, wants to plan next month.
```

One glance instead of ten minutes of scrolling.

---

## ✨ What you get

- 🧠 **AI digests, grouped by chat** — skim hours of messages in seconds
- 🆓 **A free option** — run a local model with Ollama, zero API bill
- 🔒 **Privacy-first** — in-memory only, summarize-then-discard, session stays local
- 💻 **Runs anywhere** — old Android (Termux), laptop, Raspberry Pi… any Node 20+ box
- 🔌 **Bring your own brain** — Claude, OpenAI / Groq / OpenRouter, or local Ollama / LM Studio
- 🛟 **Safe by design** — the digest only ever triggers from *your own* self-chat, so it can't leak into a group

---

## 🚀 Quickstart

```bash
git clone https://github.com/Vipul-Ydv/wa-digest.git && cd wa-digest
npm install
cp .env.example .env      # add your API key, or switch to a free local model (below)
npm start                 # scan the QR with WhatsApp, once
```

Now open your **"message yourself"** chat in WhatsApp and send `/summary`. Done.

**No paid API key?** Run it for free, fully on your machine:

```bash
# install Ollama from https://ollama.com, then:
ollama pull llama3.2
#   ...and in .env set:  PROVIDER=ollama
```

---

## 🧩 How it works

1. Links to WhatsApp as a device (one QR scan).
2. Quietly buffers incoming messages in memory, grouped by chat.
3. You text yourself `/summary` — or `/summary 6` for just the last 6 hours.
4. Your chosen model writes a short per-chat digest.
5. It lands back in your chat, and the summarized messages are dropped.

---

## 🤖 Pick your model

Set `PROVIDER` in `.env`:

| You want… | `PROVIDER=` | Notes |
| --- | --- | --- |
| Free + fully private | `ollama` | Local model, no key, nothing leaves your machine |
| Free-tier cloud | `openai` | Point `OPENAI_BASE_URL` at Groq or OpenRouter |
| Best quality (paid) | `anthropic` | Claude — Haiku is cheap, Sonnet for more polish |

> Heads-up: **every Claude model is paid** (there's no free Claude tier). If you want zero cost, go with Ollama. Full per-provider settings live in [`.env.example`](./.env.example).

---

## 💻 Run it anywhere

It's just Node 20+, so Windows/WSL2, macOS, Linux, a Raspberry Pi, or an old Android all work.

- **Always-on (recommended):** an old phone in a drawer or a Pi catches *everything*. Keep it powered and online.
- **Laptop:** works, but only catches messages while it's running. Sleep/wake reconnects on its own; a full shutdown may miss some.

<details>
<summary><b>📲 Run on an old Android phone (Termux)</b></summary>

```bash
pkg update && pkg upgrade
pkg install nodejs git
git clone https://github.com/Vipul-Ydv/wa-digest.git && cd wa-digest
npm install
cp .env.example .env
npm start
```

Keep it alive:
- Keep the phone **plugged in and on Wi-Fi** (it has to stay awake to catch messages).
- **Disable battery optimization** for Termux, and run `termux-wake-lock` so Android doesn't kill it.

</details>

<details>
<summary><b>🔁 Keep it running in the background (pm2)</b></summary>

Link your account once interactively (to scan the QR), then hand it to pm2:

```bash
npm start                       # first run only — scan the QR, then Ctrl-C
npm install -g pm2
pm2 start ecosystem.config.cjs  # background + auto-restart
pm2 save                        # survive reboots
pm2 startup                     # follow the printed command to start on boot
```

Handy: `pm2 logs wa-digest`, `pm2 restart wa-digest`, `pm2 stop wa-digest`.

</details>

---

## ⚙️ Configuration

Everything optional except the credentials for your chosen provider. Set in `.env`:

| Variable | Default | What it does |
| --- | --- | --- |
| `PROVIDER` | `anthropic` | LLM backend: `anthropic`, `ollama`, or `openai` |
| `MODEL` | per-provider | Model name (blank = the provider's default) |
| `MAX_TOKENS` | `1024` | Max length of the digest |
| `ANTHROPIC_API_KEY` | — | Needed for `anthropic` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | For `ollama` |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | For `openai` (Groq, OpenRouter, LM Studio…) |
| `OPENAI_API_KEY` | — | For `openai` (omit for keyless local servers) |
| `SUMMARY_COMMAND` | `/summary` | The text you send yourself to trigger a digest |
| `DEFAULT_HOURS` | `12` | Look-back window when no number is given |
| `BUFFER_HOURS` | `24` | How long messages stay in memory |
| `MAX_PER_CHAT` | `300` | Cap on buffered messages per chat |
| `CLEAR_AFTER_SUMMARY` | `true` | Drop summarized messages after each digest |
| `AUTH_DIR` | `auth_info` | Folder for the WhatsApp session (gitignored) |

---

## 🔒 Privacy & safety

- **No database.** Messages sit in memory, pruned by age, and cleared after each digest.
- **Local-only with Ollama.** Pick the `ollama` provider and your messages never leave your machine. With a cloud provider, only the messages in the requested window are sent to that API (over HTTPS) when you ask for a digest.
- **Your session is yours.** WhatsApp credentials live only in `auth_info/`, which is gitignored. **Never commit `auth_info/` or `.env`** — those files are effectively a logged-in copy of your WhatsApp.
- **Run it on a machine you control.** A phone in a drawer beats an exposed cloud box.

---

## ⚠️ The fine print

This uses [Baileys](https://github.com/WhiskeySockets/Baileys), an **unofficial** WhatsApp Web library. It is **not affiliated with or endorsed by WhatsApp or Meta.** Automating a personal account can break WhatsApp's Terms of Service and, in rare cases, get a number banned. So:

- Use a **spare number**, not your main one.
- Keep volume low — this is a quiet read-only digest tool.
- **Never** use it for spam, bulk messaging, stalkerware, or reading anyone's messages but your own.

Use at your own risk.

---

## 🤝 Contributing

PRs and ideas welcome — open an issue or send a pull request. Good first additions: a `/help` command, scheduled daily digests, or more model providers.

## 📄 License

[MIT](./LICENSE) — do what you like, no warranty.

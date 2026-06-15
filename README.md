# wa-digest

A privacy-first, self-hosted WhatsApp catch-up summarizer.

When you've been away from your phone, text yourself `/summary` and get a short digest of what you missed — grouped by chat, written by an LLM you choose: Claude, a **free local model** (Ollama), or any OpenAI-compatible API. It links to your WhatsApp as a normal device (the same mechanism as WhatsApp Web), buffers incoming messages **in memory only**, and throws them away after each digest. Nothing is ever written to disk.

> Not affiliated with, endorsed by, or connected to WhatsApp or Meta. See the disclaimer at the bottom — using this carries account risk. Use a spare number while testing.

## How it works

1. A small Node process links to your WhatsApp as a device (one-time QR scan).
2. It quietly buffers incoming messages in memory, grouped by chat.
3. You text yourself the command (default `/summary`, or `/summary 6` for the last 6 hours).
4. Your chosen model turns the buffered messages into a short per-chat digest.
5. The digest is sent back to you in your own chat. The summarized messages are then dropped.

The digest **only triggers from your own self-chat**, so it can never accidentally be posted into a group or someone else's conversation.

## Privacy design

- **No database.** Messages live in process memory and are pruned by age (default 24h).
- **Summarize-then-discard.** After each digest, the covered messages are cleared.
- **Local session.** WhatsApp credentials are stored only in `auth_info/`, which is gitignored.
- **Where messages go depends on your provider.** With **Ollama** (local), messages never leave your machine — summarization happens on-device, the most private option. With a cloud provider (Anthropic or OpenAI-compatible), the messages in the window are sent to that API over HTTPS when a digest runs; keep genuinely sensitive chats out of it and review that provider's data policy. Either way, the people messaging you haven't opted into this — that's on you to weigh.

## Requirements

- Node.js 20 or newer
- An LLM backend (pick one): an Anthropic API key, an OpenAI-compatible API key, or [Ollama](https://ollama.com) installed locally for free
- A phone with WhatsApp to scan the QR once (ideally a spare number)

## Setup

```bash
git clone <your-repo-url> wa-digest
cd wa-digest
npm install
cp .env.example .env      # then pick a provider and fill in what it needs
npm start
```

On first run a QR code prints in the terminal. On your phone: **Settings → Linked Devices → Link a Device**, and scan it. After that the session is saved and you won't need to scan again.

## Choosing a model (free and paid)

Set `PROVIDER` in `.env`. Note that **all Anthropic models cost money** (there's no free Claude API tier), so if you don't have a paid key, use Ollama or a free-tier OpenAI-compatible provider.

**Free + local (no key, most private) — Ollama**

```bash
# install Ollama from https://ollama.com, then:
ollama pull llama3.2
```

```ini
PROVIDER=ollama
MODEL=llama3.2          # or qwen2.5, mistral, phi3, etc.
```

Everything runs on your machine and no message ever leaves it. With your GPU, this is fast and completely free.

**Free-tier or paid cloud — OpenAI-compatible**

Works with OpenAI, and with providers that have free tiers like Groq and OpenRouter, and local servers like LM Studio:

```ini
PROVIDER=openai
OPENAI_BASE_URL=https://api.groq.com/openai/v1   # or openai.com, openrouter.ai, localhost...
OPENAI_API_KEY=your-key                           # omit for local servers that don't need one
MODEL=llama-3.3-70b-versatile                     # whatever your provider offers
```

(Check the provider's current pricing/free-tier terms — they change.)

**Paid — Anthropic (Claude)**

```ini
PROVIDER=anthropic
MODEL=claude-haiku-4-5-20251001   # cheapest; or claude-sonnet-4-6 for higher quality
ANTHROPIC_API_KEY=your-key
```

If `MODEL` is left blank, each provider falls back to a sensible default.

## Usage

From your own "message yourself" chat in WhatsApp:

- `/summary` — digest of the default window (12h)
- `/summary 6` — digest of the last 6 hours
- `/summary 0.5` — last 30 minutes

You'll get a quick "Summarizing..." acknowledgement, then the digest.

## Running on an old Android phone (Termux)

An old phone makes a great always-on host. Using [Termux](https://termux.dev):

```bash
pkg update && pkg upgrade
pkg install nodejs git
git clone <your-repo-url> wa-digest && cd wa-digest
npm install
cp .env.example .env   # add your key
npm start
```

Two things to keep it alive:

- Keep the phone **plugged in and on Wi-Fi** — it has to stay awake to catch messages.
- **Disable battery optimization for Termux** (Android settings → Apps → Termux → Battery → Unrestricted), and run `termux-wake-lock` so Android doesn't kill it in the background.

## Running on a laptop

It runs on a laptop as-is — Windows (including WSL2), macOS, and Linux all use the same `npm install && npm start`. The catch is that a laptop sleeps, closes, and shuts down, and the tool can only catch messages while it's actually running.

A few notes:

- **Sleep and wake.** When the laptop sleeps and wakes, the WhatsApp link drops and reconnects automatically (with a short backoff). You don't need to do anything.
- **Offline messages.** While the laptop is off or asleep, WhatsApp queues messages for the linked device and delivers them when it reconnects — so a short nap usually doesn't lose anything. Long offline periods are best-effort; don't rely on it catching a full day while the lid was shut.
- **WSL2.** Works fine. Run it inside your WSL2 shell exactly as on Linux. (`auth_info/` will live in the WSL filesystem.)
- **Linked-device slots.** This uses one of WhatsApp's linked-device slots (max 4), alongside any WhatsApp Web sessions you have open.

### Keeping it running in the background

The cleanest cross-platform option is [pm2](https://pm2.keymetrics.io). Link your account once interactively (so you can scan the QR), then hand it to pm2:

```bash
npm start                         # first run only — scan the QR
# Ctrl-C once it says "Connected"
npm install -g pm2
pm2 start ecosystem.config.cjs    # runs in the background, restarts on crash
pm2 save                          # remember across reboots
pm2 startup                       # follow the printed command to start on boot
```

Useful afterwards: `pm2 logs wa-digest`, `pm2 restart wa-digest`, `pm2 stop wa-digest`.

On macOS you can alternatively use a `launchd` agent, and on Linux a systemd user service — but pm2 is the least fiddly and works identically everywhere.



## Configuration

All optional except the credentials for your chosen provider. Set in `.env`:

| Variable | Default | Meaning |
| --- | --- | --- |
| `PROVIDER` | `anthropic` | LLM backend: `anthropic`, `ollama`, or `openai`. |
| `MODEL` | per-provider | Model name. Blank = the provider's default. |
| `MAX_TOKENS` | `1024` | Max length of the digest. |
| `ANTHROPIC_API_KEY` | — | Needed when `PROVIDER=anthropic`. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server, when `PROVIDER=ollama`. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Endpoint, when `PROVIDER=openai`. |
| `OPENAI_API_KEY` | — | Key for `PROVIDER=openai` (omit for keyless local servers). |
| `SUMMARY_COMMAND` | `/summary` | The text you send yourself to trigger a digest. |
| `DEFAULT_HOURS` | `12` | Look-back window when no number is given. |
| `BUFFER_HOURS` | `24` | How long messages stay in memory before being dropped. |
| `MAX_PER_CHAT` | `300` | Cap on buffered messages per chat. |
| `CLEAR_AFTER_SUMMARY` | `true` | Drop summarized messages after each digest. |
| `AUTH_DIR` | `auth_info` | Folder for the WhatsApp session (gitignored). |

## Security notes

- **Never commit `auth_info/` or `.env`.** They're gitignored for a reason — the session files are effectively a logged-in copy of your WhatsApp. Anyone who gets them can read and send as you.
- Run it on a machine you control. A phone in a drawer at home beats an exposed cloud VM.
- Don't expose it to the internet — there's no inbound server, so just keep it behind your router with no port forwarding.

## Disclaimer

This project uses an unofficial WhatsApp Web library ([Baileys](https://github.com/WhiskeySockets/Baileys)) and is **not affiliated with or endorsed by WhatsApp or Meta**. Automating a personal account can violate WhatsApp's Terms of Service and may, in rare cases, lead to the number being banned. Use a spare number, keep volume low, and never use this for bulk messaging, spam, stalkerware, or reading anyone's messages but your own. Use at your own risk.

## License

MIT — see [LICENSE](./LICENSE).

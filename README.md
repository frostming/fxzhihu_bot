# FxZhihu Bot

Telegram Bot for [FxZhihu](https://github.com/frostming/fxzhihu), deployed on Cloudflare Workers.

## Host yourself

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)
- A [Cloudflare](https://cloudflare.com/) account
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

### Setup

Clone the repository:

```bash
git clone https://github.com/frostming/fxzhihu_bot.git
cd fxzhihu_bot
```

Install dependencies:

```bash
pnpm install
```

### Local Development

Create a `.dev.vars` file in the root directory:

```
BOT_TOKEN=your_bot_token_here
```

Start the dev server:

```bash
pnpm dev
```

### Deploy to Cloudflare Workers

1. Set the bot token as a secret:

```bash
npx wrangler secret put BOT_TOKEN
```

2. Deploy:

```bash
pnpm deploy
```

3. Set the Telegram webhook (run once after deployment):

```bash
BOT_TOKEN=your_token WEBHOOK_URL=https://your-worker.workers.dev/webhook node scripts/set-webhook.js
```

### GitHub Actions

To enable automatic deployment via GitHub Actions, add these secrets to your repository:

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Workers edit permission
- `BOT_TOKEN` - Telegram bot token

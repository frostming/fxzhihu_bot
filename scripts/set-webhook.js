// Usage: BOT_TOKEN=xxx WEBHOOK_URL=https://your-worker.workers.dev/webhook node scripts/set-webhook.js

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error("BOT_TOKEN and WEBHOOK_URL environment variables are required");
  process.exit(1);
}

async function setWebhook() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ["inline_query"],
    }),
  });

  const result = await response.json();
  console.log("Set webhook result:", result);
}

setWebhook();

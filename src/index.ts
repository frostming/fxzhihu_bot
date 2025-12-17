import { Bot, webhookCallback, InlineQueryResultBuilder } from "grammy";

export interface Env {
	BOT_TOKEN: string;
}

const LINK_PREVIEW_FORMAT =
	"https://t.me/iv?url={url}&rhash=6bebaec97e3897";
const URL_REGEX =
	/https:\/\/(www|zhuanlan)\.?zhihu\.com\/(p\/\d+|question\/\d+(?:\/answer\/\d+)?)/;

async function fetchTitle(url: string): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP error: ${response.status}`);
	}
	const html = await response.text();
	const match = html.match(/<title>(.+?)<\/title>/);
	return match ? match[1] : "Zhihu Link";
}

function createBot(token: string): Bot {
	const bot = new Bot(token);

	bot.on("inline_query", async (ctx) => {
		const query = ctx.inlineQuery.query;

		if (!URL_REGEX.test(query)) {
			return;
		}

		const fixedUrl = query.replace(".zhihu.com", ".fxzhihu.com");
		const previewUrl = LINK_PREVIEW_FORMAT.replace(
			"{url}",
			encodeURIComponent(fixedUrl)
		);

		try {
			const title = await fetchTitle(fixedUrl);
			const result = InlineQueryResultBuilder.article("1", title, {
				thumbnail_url:
					"https://cdn.jsdelivr.net/gh/frostming/fxzhihu_bot/zhihu.webp",
			}).text(previewUrl);

			await ctx.answerInlineQuery([result], { cache_time: 300 });
		} catch (error) {
			console.error("Error handling inline query:", error);
		}
	});

	return bot;
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/webhook" && request.method === "POST") {
			const bot = createBot(env.BOT_TOKEN);
			const handler = webhookCallback(bot, "cloudflare-mod");
			return handler(request);
		}

		return new Response("Bot is running", { status: 200 });
	},
} satisfies ExportedHandler<Env>;

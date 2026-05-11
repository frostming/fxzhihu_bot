import { Bot, webhookCallback, InlineQueryResultBuilder } from "grammy";

const LINK_PREVIEW_FORMAT =
	"https://t.me/iv?url={url}&rhash=6bebaec97e3897";
const URL_REGEX =
	/https:\/\/(www|zhuanlan)\.?zhihu\.com\/(p\/\d+|question\/\d+(?:\/answer\/\d+)?)/;

// 跟踪参数判定规则：以 utm_ 或 share_ 为前缀的查询参数都视为跟踪参数。
const TRACKING_PARAM_REGEX = /^(utm|share)_/;

/**
 * 把知乎链接转换为可在 Telegram 中预览的 fxzhihu 链接：
 *
 * 1. 删除查询字符串中的跟踪参数（utm_*、share_*）；
 * 2. 把 *.zhihu.com 主机替换为 *.fxzhihu.com。
 *
 * 如果输入不是合法 URL，则原样返回。
 */
export function toFxZhihuUrl(rawUrl: string): string {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		return rawUrl;
	}

	const params = url.searchParams;
	const keysToDelete: string[] = [];
	for (const key of params.keys()) {
		if (TRACKING_PARAM_REGEX.test(key)) {
			keysToDelete.push(key);
		}
	}
	for (const key of keysToDelete) {
		params.delete(key);
	}

	// 如果没有剩余的查询参数，去掉末尾的 "?"
	if ([...params.keys()].length === 0) {
		url.search = "";
	}

	url.hostname = url.hostname.replace(/\.zhihu\.com$/, ".fxzhihu.com");

	return url.toString();
}

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

		const fixedUrl = toFxZhihuUrl(query);
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

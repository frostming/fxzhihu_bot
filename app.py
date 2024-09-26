from __future__ import annotations

import logging
import os
import re
import sys
from urllib.parse import quote

import httpx
from telebot import TeleBot
from telebot.types import (
    InlineQuery,
    InlineQueryResultArticle,
    InputTextMessageContent,
)

logger = logging.getLogger(__name__)
is_debug = "-d" in sys.argv

bot = TeleBot(token=os.environ["BOT_TOKEN"])

LINK_PREVIEW_FORMAT = "https://t.me/iv?url={}&rhash=6bebaec97e3897"
URL_REGEX = re.compile(
    r"https://(www|zhuanlan)\.?zhihu\.com/(p/\d+|question/\d+(?:/answer/\d+)?)"
)


def fetch_title(url: str) -> str:
    response = httpx.get(url)
    response.raise_for_status()
    title = re.findall(r"<title>(.+?)</title>", response.text)[0]
    return title


@bot.inline_handler(func=lambda query: URL_REGEX.search(query.query) is not None)
def fix_zhihu_link(inline_query: InlineQuery):
    logger.debug(f"Received inline query: {inline_query.query}")
    text = inline_query.query
    fixed_url = text.replace(".zhihu.com", ".fxzhihu.com")
    preview_url = LINK_PREVIEW_FORMAT.format(quote(fixed_url, safe=":/"))
    logger.debug(f"Preview URL: {preview_url}")
    try:
        title = fetch_title(fixed_url)
        bot.answer_inline_query(
            inline_query.id,
            cache_time=0 if is_debug else None,
            results=[
                InlineQueryResultArticle(
                    id="1",
                    title=title,
                    thumbnail_url="https://cdn.jsdelivr.net/gh/frostming/fxzhihu_bot/zhihu.webp",
                    input_message_content=InputTextMessageContent(
                        message_text=preview_url
                    ),
                )
            ],
        )
    except Exception:
        logger.exception("Error answering inline query")


def setup_logger():
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG if is_debug else logging.INFO)


def main():
    setup_logger()

    logger.info("Bot started.")
    bot.infinity_polling()


if __name__ == "__main__":
    main()

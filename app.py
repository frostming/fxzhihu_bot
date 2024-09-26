from __future__ import annotations

import logging
import os
import re
import sys
from urllib.parse import quote

from telebot import TeleBot
from telebot.types import (
    InlineQuery,
    InlineQueryResultArticle,
    InputTextMessageContent,
)

logger = logging.getLogger(__name__)
is_debug = "-id" in sys.argv

bot = TeleBot(token=os.environ["BOT_TOKEN"])

LINK_PREVIEW_FORMAT = "https://t.me/iv?url={}&rhash=6bebaec97e3897"
URL_REGEX = re.compile(
    r"https://(www|zhuanlan)\.?zhihu\.com/(p/\d+|question/\d+(?:/answer/\d+)?)"
)


@bot.inline_handler(func=lambda query: True)
def fix_zhihu_link(inline_query: InlineQuery):
    logger.debug(f"Received inline query: {inline_query.query}")
    text = inline_query.query
    if not URL_REGEX.search(text):
        return
    fixed_url = text.replace(".zhihu.com", ".fxzhihu.com")
    preview_url = LINK_PREVIEW_FORMAT.format(quote(fixed_url, safe=":/"))
    logger.debug(f"Preview URL: {preview_url}")
    try:
        bot.answer_inline_query(
            inline_query.id,
            cache_time=0 if is_debug else None,
            results=[
                InlineQueryResultArticle(
                    id="1",
                    title="Link preview",
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

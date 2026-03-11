"""Stateless session encoding.

The entire conversation state is compressed + base64-encoded into a token
that the client stores and echoes back with every answer request.
This survives hot reloads, multiple workers, and restarts with no extra infra.
"""
from __future__ import annotations

import base64
import json
import zlib

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage


def msgs_to_dicts(messages: list[BaseMessage]) -> list[dict[str, str]]:
    return [{"type": m.type, "content": str(m.content)} for m in messages]


def dicts_to_msgs(data: list[dict[str, str]]) -> list[BaseMessage]:
    type_map: dict[str, type[BaseMessage]] = {
        "system": SystemMessage,
        "human": HumanMessage,
        "ai": AIMessage,
    }
    return [type_map.get(d["type"], HumanMessage)(content=d["content"]) for d in data]


def encode_token(payload: dict) -> str:  # type: ignore[type-arg]
    raw = json.dumps(payload, ensure_ascii=False).encode()
    compressed = zlib.compress(raw, level=6)
    return base64.urlsafe_b64encode(compressed).decode()


def decode_token(token: str) -> dict:  # type: ignore[type-arg]
    compressed = base64.urlsafe_b64decode(token)
    raw = zlib.decompress(compressed)
    return json.loads(raw)

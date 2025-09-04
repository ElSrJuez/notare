"""Abstraction layer for calling different LLM back-ends (BYOM principle)."""
from __future__ import annotations

import abc
import json
import logging
import os
from typing import List, Dict
import asyncio
import re

import httpx
from pydantic import BaseModel, Field

try:
    import openai  # Optional dependency
except ImportError:  # pragma: no cover
    openai = None  # type: ignore

logger = logging.getLogger("notare.llm")
logger.setLevel(logging.INFO)

# Enable httpx debug when needed
httpx_logger = logging.getLogger("httpx")
httpx_logger.setLevel(logging.INFO)
httpx_logger.addHandler(logging.StreamHandler())


class OutlineError(Exception):
    """Raised when an outline cannot be produced by the provider."""


class BaseProvider(abc.ABC):
    @abc.abstractmethod
    async def generate_outline(self, markdown: str) -> Dict:
        """Return outline JSON given annotated markdown."""


class OpenAIProvider(BaseProvider):
    def __init__(self, cfg: Dict) -> None:
        """cfg expects keys: api_key, model, optional endpoint, api_version."""
        if openai is None:
            raise RuntimeError("openai package not installed. Add it to requirements.txt.")
        api_key = cfg.get("api_key")
        if not api_key:
            raise RuntimeError("api_key missing in config for OpenAI provider")
        model = cfg.get("model", "gpt-4o-chat-bison")
        endpoint = cfg.get("endpoint")
        api_version = cfg.get("api_version") or cfg.get("engine")

        # Choose regular cloud or Azure client
        if endpoint:
            endpoint = endpoint.rstrip("/")
            # AzureOpenAI client
            self.client = openai.AzureOpenAI(
                api_key=api_key,
                azure_endpoint=endpoint,
                api_version=api_version or "2024-05-01-preview",
            )
            logger.info("Azure endpoint = %s", endpoint)
            logger.info("Deployment/model = %s", model)
            logger.info("API version = %s", api_version or "default")
        else:
            # Public OpenAI cloud
            self.client = openai.OpenAI(api_key=api_key)
        self.model = model

    async def generate_outline(self, markdown: str) -> Dict:
        system_msg = {
            "role": "system",
            "content": (
                "You are Notāre, an AI presentation assistant.\n"
                "INPUT: Markdown where important spans are wrapped in <<mark>> … <</mark>>.\n"
                "GOAL: Produce a JSON object with a list of slides for a PowerPoint deck. Each slide must contain:\n"
                "  • title – ≤ 12 words, sentence-case, without the delimiters\n"
                "  • bullets – 2-6 concise bullet strings (≤ 15 words each), without the delimiters\n"
                "Emphasise ideas contained in the marked spans, but consider the entire text.\n"
                "Do NOT copy the <<mark>> or <</mark>> tokens, HTML, or markdown formatting into the output.\n"
                "Summarise; avoid duplication. Respond ONLY with valid JSON conforming to the schema:\n"
                "{\"slides\": [{\"title\": string, \"bullets\": [string]}]}"
            ),
        }
        user_msg = {"role": "user", "content": markdown}
        try:
            completion = await asyncio.to_thread(
                self.client.chat.completions.parse,
                model=self.model,
                messages=[system_msg, user_msg],  # type: ignore[arg-type]
                response_format=OutlineModel,
            )
            outline_obj: OutlineModel = completion.choices[0].message.parsed  # type: ignore
            return outline_obj.model_dump()
        except Exception as e:  # pragma: no cover
            raise OutlineError(str(e)) from e


class LlamaHTTPProvider(BaseProvider):
    """Simple llama.cpp HTTP server (ggml) provider."""

    def __init__(self, base_url: str = "http://localhost:8080/completions", model: str | None = None):
        self.base_url = base_url
        self.model = model

    async def generate_outline(self, markdown: str) -> Dict:
        payload = {
            "prompt": (
                "You are a presentation assistant. Produce a concise JSON outline for a PowerPoint presentation based on the article below. "
                "Prioritise text wrapped in <<mark>> tags, but consider the whole content. Return JSON only.\n\nARTICLE:\n" + markdown
            ),
            "max_tokens": 800,
            "temperature": 0.4,
        }
        if self.model:
            payload["model"] = self.model
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(self.base_url, json=payload)
            resp.raise_for_status()
            text = resp.json().get("choices", [{}])[0].get("text", "").strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:  # pragma: no cover
            raise OutlineError("Model returned invalid JSON") from e


class Slide(BaseModel):
    """Single slide in outline."""
    title: str = Field(..., description="Slide title")
    bullets: List[str] = Field(..., description="Bullet points")


class OutlineModel(BaseModel):
    """Presentation outline returned by LLM."""
    slides: List[Slide]


# Helper retained for unit tests; caller must pass full config.
def get_provider(cfg: dict) -> BaseProvider:  # pragma: no cover
    name = cfg.get("provider", "openai").lower()
    if name == "openai":
        return OpenAIProvider(cfg)
    if name == "llama":
        return LlamaHTTPProvider(cfg.get("endpoint", "http://localhost:8080/completions"), cfg.get("model"))
    raise RuntimeError(f"Unknown provider '{name}'")

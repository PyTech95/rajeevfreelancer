"""Direct Gemini provider used by the production VPS.

This module deliberately isolates the Google Gen AI SDK from the rest of the
application so existing business logic and API response shapes remain intact.
"""
import os
from typing import Optional


def _api_key() -> str:
    key = (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or "").strip()
    if not key:
        raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) is not configured")
    return key


def _text_model() -> str:
    return (os.environ.get("GEMINI_TEXT_MODEL") or "gemini-2.5-flash").strip()


def _image_model() -> str:
    return (os.environ.get("GEMINI_IMAGE_MODEL") or "gemini-2.5-flash-image").strip()


async def generate_text(prompt: str, system: Optional[str] = None, model: Optional[str] = None) -> str:
    """Generate text asynchronously using Google's official google-genai SDK."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=_api_key())
    config = types.GenerateContentConfig(system_instruction=system) if system else None
    try:
        response = await client.aio.models.generate_content(
            model=model or _text_model(),
            contents=prompt,
            config=config,
        )
        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Gemini returned an empty text response")
        return text
    finally:
        # The SDK exposes an async close method on the aio client. Keep this
        # defensive for compatibility across google-genai minor versions.
        close = getattr(client.aio, "aclose", None) or getattr(client.aio, "close", None)
        if close:
            result = close()
            if hasattr(result, "__await__"):
                await result


async def generate_image(prompt: str, system: Optional[str] = None, model: Optional[str] = None) -> bytes:
    """Generate one image and return the raw encoded image bytes."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=_api_key())
    combined_prompt = f"{system}\n\n{prompt}" if system else prompt
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="16:9"),
    )
    try:
        response = await client.aio.models.generate_content(
            model=model or _image_model(),
            contents=combined_prompt,
            config=config,
        )
        for part in (getattr(response, "parts", None) or []):
            inline = getattr(part, "inline_data", None)
            data = getattr(inline, "data", None) if inline else None
            if data:
                if isinstance(data, str):
                    import base64
                    return base64.b64decode(data)
                return bytes(data)
        raise RuntimeError("Gemini returned no image data")
    finally:
        close = getattr(client.aio, "aclose", None) or getattr(client.aio, "close", None)
        if close:
            result = close()
            if hasattr(result, "__await__"):
                await result

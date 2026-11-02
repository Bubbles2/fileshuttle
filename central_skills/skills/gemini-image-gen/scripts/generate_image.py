#!/usr/bin/env python3
"""
Generate images using the Google Gemini API (gemini-2.5-flash-image).

Usage:
    python generate_image.py --prompt "a cat on a beach" [--output-name my_image] [--output-dir ./out] [--full-res]

Requirements:
    pip install google-genai
    GEMINI_API_KEY environment variable must be set.
"""

import argparse
import mimetypes
import os
import sys
from pathlib import Path


def save_binary_file(file_path: str, data: bytes) -> None:
    with open(file_path, "wb") as f:
        f.write(data)
    print(f"Saved: {file_path}")


def generate_image(
    prompt: str,
    output_name: str = "generated_image",
    output_dir: str = ".",
    full_res: bool = False,
) -> list[str]:
    """
    Generate an image from a text prompt using Gemini Flash image model.

    Returns a list of saved file paths.
    """
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("ERROR: google-genai is not installed. Run: pip install google-genai")
        sys.exit(1)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable is not set.")
        print("Get a key from https://aistudio.google.com/ and set it:")
        print("  export GEMINI_API_KEY='your-key'   # Linux/macOS/Git Bash")
        print("  $env:GEMINI_API_KEY='your-key'     # Windows PowerShell")
        sys.exit(1)

    # Keep output small by default — the model responds to resolution hints in the prompt
    if not full_res:
        size_hint = " low resolution, 1024x1024, compact file size"
        if size_hint.strip() not in prompt:
            prompt = prompt.rstrip(".") + "," + size_hint

    print(f"Prompt: {prompt}")
    print(f"Model:  gemini-2.5-flash-image")
    print(f"Output: {output_dir}/{output_name}.*\n")

    client = genai.Client(api_key=api_key)

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
    )

    saved_files = []
    file_index = 0

    for chunk in client.models.generate_content_stream(
        model="gemini-2.5-flash-image",
        contents=contents,
        config=config,
    ):
        if chunk.parts is None:
            continue

        part = chunk.parts[0]

        if part.inline_data and part.inline_data.data:
            inline_data = part.inline_data
            ext = mimetypes.guess_extension(inline_data.mime_type) or ".png"
            # Fix common extension issues (.jpe -> .jpg)
            if ext == ".jpe":
                ext = ".jpg"

            suffix = f"_{file_index}" if file_index > 0 else ""
            filename = f"{output_name}{suffix}{ext}"
            dest = str(Path(output_dir) / filename)

            Path(output_dir).mkdir(parents=True, exist_ok=True)
            save_binary_file(dest, inline_data.data)
            saved_files.append(dest)
            file_index += 1

        elif hasattr(part, "text") and part.text:
            print(f"Model text: {part.text}")

    if not saved_files:
        print("No image was returned. The model may have declined the request.")
    else:
        print(f"\nDone — {len(saved_files)} image(s) saved.")

    return saved_files


def main():
    parser = argparse.ArgumentParser(description="Generate images with Gemini Flash")
    parser.add_argument("--prompt", required=True, help="Text description of the image to generate")
    parser.add_argument("--output-name", default="generated_image", help="Base filename (no extension)")
    parser.add_argument("--output-dir", default=".", help="Directory to save images in")
    parser.add_argument(
        "--full-res",
        action="store_true",
        help="Skip the low-resolution size hint (generates at model default size)",
    )
    args = parser.parse_args()

    generate_image(
        prompt=args.prompt,
        output_name=args.output_name,
        output_dir=args.output_dir,
        full_res=args.full_res,
    )


if __name__ == "__main__":
    main()

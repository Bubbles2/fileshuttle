---
name: gemini-image-gen
description: Generate images using the Google Gemini API (gemini-2.5-flash-image model). Use this skill whenever the user wants to generate, create, or produce images using Google AI, Gemini, or the Gemini Flash image model — even if they don't say "Gemini" explicitly and just ask to "generate an image with Google AI" or "make an image using the AI API". Triggers on requests involving AI image generation, Gemini image creation, or Google generative images.
---

# Gemini Image Generator

Generate images using Google's `gemini-2.5-flash-image` model via the `google-genai` Python SDK. Images are saved locally.

## Prerequisites

**Install the SDK:**
```bash
pip install google-genai
```

**Set your API key** (get one from Google AI Studio):
```bash
export GEMINI_API_KEY="your-api-key-here"
```
On Windows (PowerShell): `$env:GEMINI_API_KEY="your-api-key-here"`

## Workflow

### Step 1 — Confirm inputs

Ask the user for (or infer from context):
- **Prompt**: what the image should show (be specific and descriptive)
- **Output filename** (optional, default: `generated_image`)
- **Output directory** (optional, default: current working directory)

### Step 2 — Build and run the generation script

Use the script at `scripts/generate_image.py`. Run it like this:

```bash
python /c/Users/D.Finlay/.claude/skills/gemini-image-gen/scripts/generate_image.py \
  --prompt "your image description here" \
  --output-name "my_image" \
  --output-dir "./images"
```

Or inline for quick use:

```bash
python /c/Users/D.Finlay/.claude/skills/gemini-image-gen/scripts/generate_image.py \
  --prompt "a golden retriever puppy playing in autumn leaves, photorealistic"
```

### Step 3 — Resolution / size

The Gemini Flash image model doesn't expose explicit resolution parameters — it determines output size internally. To get the **smallest / ~1K output**:
- Append `"low resolution, 1024x1024, compact file size"` to the prompt automatically
- The script does this by default unless `--full-res` is passed

### Step 4 — Report to the user

Tell the user:
- The full path to each saved image file
- The file format (usually PNG or JPEG)
- Any text the model returned alongside the image

## Prompt tips

Good prompts are detailed and specific. Examples:

| What you want | Good prompt |
|---|---|
| Photo of person | `"photo of a woman jogging on a beach at sunrise, natural lighting, 35mm film style"` |
| Product image | `"white ceramic coffee mug on a wooden table, soft studio lighting, product photography"` |
| Illustration | `"vector illustration of a small robot watering a garden, flat design, pastel colors"` |

## Troubleshooting

- **`GEMINI_API_KEY not set`** — set the environment variable before running
- **`ModuleNotFoundError: google`** — run `pip install google-genai`
- **No image in output** — the model may have returned text only; check printed output for a safety refusal message
- **Model not found** — ensure you're using `gemini-2.5-flash-image` (not `gemini-2.5-flash`)

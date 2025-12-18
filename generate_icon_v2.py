"""
HeartLift App Icon - Match existing style
"""

import os
import asyncio

os.environ["EMERGENT_LLM_KEY"] = "sk-emergent-a8bA8F422Bb2e71BcE"

from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

async def generate_icon(prompt: str, filename: str):
    print(f"\n🎨 Generating: {filename}")
    
    try:
        generator = OpenAIImageGeneration(
            api_key=os.environ["EMERGENT_LLM_KEY"]
        )
        
        result = await generator.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1,
            quality="hd"
        )
        
        if result and len(result) > 0:
            output_path = f"/app/app_icons/{filename}"
            with open(output_path, 'wb') as f:
                f.write(result[0])
            print(f"   ✅ Saved to: {output_path}")
            return output_path
        else:
            print(f"   ❌ No image data returned")
            return None
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

async def main():
    print("=" * 60)
    print("🚀 HeartLift Icon - Matching Current Style")
    print("=" * 60)
    
    # Exact match to user's current icon
    prompt = """App icon design, 1024x1024 pixels, iOS app icon format with rounded square corners.

EXACT DESIGN:
- Light cream/beige solid background color (like #FAF5F0 or warm off-white)
- Large pink circle in the center (coral pink, like #E8789A or similar dusty rose pink)
- Inside the pink circle: a WHITE OUTLINE heart shape (not filled, just the stroke/line drawing)
- The heart outline is white, clean, simple line art style with rounded edges
- Small golden/orange decorative sparkle stars scattered around the pink circle:
  - 2-3 small four-pointed sparkle stars in the top right area
  - 1 small decorative swirl or sparkle element in the bottom left area
- The sparkles are golden yellow/orange color (#FFB347 or similar warm gold)
- Clean, minimal, cute aesthetic
- NO text, NO words
- Soft, feminine, wellness app style
- The pink circle should be centered and take up most of the icon space
- Simple and clean, not cluttered"""

    await generate_icon(prompt, "heartlift_icon_current_style.png")
    
    print("\n📁 Icon saved to: /app/app_icons/")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

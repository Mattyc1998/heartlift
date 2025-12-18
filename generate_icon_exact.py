"""
HeartLift App Icon - EXACT match to current App Store icon
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
    print("🚀 HeartLift Icon - EXACT Match")
    print("=" * 60)
    
    # Generate multiple variations to get the best match
    prompts = [
        # Version 1 - Very specific
        {
            "name": "heartlift_exact_v1.png",
            "prompt": """iOS app icon, 1024x1024 pixels, rounded square corners.

EXACT DESIGN SPECIFICATION:
- Background: Soft cream/ivory off-white color (#FDF8F3)
- Center element: Large solid pink/coral circle filling most of the icon
- The pink circle color is a dusty rose pink (#E88DA4)
- Inside the pink circle: A simple WHITE heart OUTLINE (stroke only, not filled)
- The heart is drawn with a white line/stroke, approximately medium thickness
- The heart shape is classic and symmetrical with rounded lobes at top
- Small golden yellow four-pointed sparkle stars decorating around the circle:
  * Two small sparkles in the upper right area outside the pink circle
  * One small sparkle in the lower left area outside the pink circle
- Sparkle color: Golden yellow (#FFCC00)
- Style: Clean, minimal, cute, feminine wellness app
- NO text, NO additional elements
- The design should look like a hand-drawn cute app icon"""
        },
        # Version 2 - Alternative wording
        {
            "name": "heartlift_exact_v2.png",
            "prompt": """App icon design for iOS, square with rounded corners, 1024x1024.

Create this EXACT design:
1. BACKGROUND: Light cream/beige solid color (warm off-white like #FAF5F0)
2. MAIN SHAPE: A large pink circle centered in the icon (dusty rose pink #E8899F)
3. HEART: Inside the circle, a WHITE line-art heart outline (not solid/filled)
   - The heart is just the outline/border in white color
   - Classic heart shape, symmetrical, medium stroke width
4. SPARKLES: Small golden/yellow decorative stars around the pink circle
   - 2 small four-pointed stars near top-right of the circle
   - 1 small star or swirl element near bottom-left
   - Color: warm golden yellow

Style: Cute, clean, minimalist, wellness/health app aesthetic
NO text, NO gradients on background, simple flat design with the pink circle"""
        },
        # Version 3 - Simpler description
        {
            "name": "heartlift_exact_v3.png",
            "prompt": """Cute iOS app icon, 1024x1024 pixels.

Simple design:
- Cream/ivory background color
- Large pink circle in center (soft dusty rose pink)
- White outlined heart shape inside the pink circle (line drawing, not filled)
- Small golden sparkle stars decorating: 2 stars top-right, 1 star bottom-left
- Clean minimal style, no text, no extra details
- Feminine wellness app look
- The heart should be a simple white stroke/outline, not a solid shape"""
        }
    ]
    
    for p in prompts:
        await generate_icon(p["prompt"], p["name"])
    
    print("\n📁 Icons saved to: /app/app_icons/")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

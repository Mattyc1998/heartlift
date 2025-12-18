"""
HeartLift App Icon - Recreate EXACT design at 1024x1024
Pink circle, white outline heart, golden sparkles
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
        return None
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

async def main():
    print("=" * 60)
    print("🚀 Recreating EXACT HeartLift Icon Design")
    print("=" * 60)
    
    prompt = """iOS app icon, 1024x1024 pixels, square with rounded corners.

RECREATE THIS EXACT DESIGN:

1. BACKGROUND: Light cream/ivory off-white solid color (#FBF7F4 or similar warm white)

2. MAIN ELEMENT: A large pink circle centered in the icon
   - The circle has a soft pink gradient (lighter pink at top-left, slightly deeper pink at bottom-right)
   - Pink color approximately #E8899F or dusty rose pink
   - The circle should fill most of the icon space

3. HEART: Inside the pink circle, a WHITE OUTLINED heart
   - IMPORTANT: The heart is ONLY an outline/stroke - NOT filled/solid
   - The heart outline is white color, clean smooth lines
   - Medium stroke thickness, smooth and crisp edges
   - Classic symmetrical heart shape
   - DO NOT break the heart edges - they must be smooth and complete

4. DECORATIVE SPARKLES:
   - Upper right area (outside the pink circle): 2-3 small golden four-pointed star sparkles
   - Lower left area (outside the pink circle): 1 golden curved swirl/arc element
   - Sparkle color: Golden yellow/orange (#FFB347 or warm gold)
   - The sparkles should have a slight 3D glossy look

5. STYLE: Clean, cute, feminine, wellness app aesthetic
   - NO text
   - Simple and clean design
   - The heart outline must have PERFECT smooth edges - no broken or jagged lines"""

    await generate_icon(prompt, "FINAL_HEARTLIFT_ICON.png")
    
    print("\n📁 Icon saved to: /app/app_icons/FINAL_HEARTLIFT_ICON.png")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

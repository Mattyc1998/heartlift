"""
HeartLift Premium App Icon Generator
Generates 3 premium icon variations using OpenAI gpt-image-1
"""

import os
import asyncio

# Set the Emergent LLM key
os.environ["EMERGENT_LLM_KEY"] = "sk-emergent-a8bA8F422Bb2e71BcE"

from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

async def generate_icon(prompt: str, filename: str):
    """Generate an icon using OpenAI image generation"""
    print(f"\n🎨 Generating: {filename}")
    print(f"   Prompt preview: {prompt[:80].strip()}...")
    
    try:
        generator = OpenAIImageGeneration(
            api_key=os.environ["EMERGENT_LLM_KEY"]
        )
        
        # Generate the image (async, returns List[bytes])
        result = await generator.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1,
            quality="hd"  # High quality for app icon
        )
        
        if result and len(result) > 0:
            # Save the image bytes
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
    print("🚀 HeartLift Premium App Icon Generator")
    print("=" * 60)
    
    # Base style requirements for all icons
    base_style = """iOS app icon, 1024x1024 pixels, square with rounded corners.
Single elegant heart shape centered in the icon.
NO text, NO words, NO letters, NO sparkles, NO stars, NO extra decorations.
Clean minimalist design. Matte finish. Smooth gradient. Professional premium quality.
The heart should be beautifully refined, not clipart-style."""
    
    icons = [
        {
            "name": "heartlift_icon_A_calm_elegance.png",
            "prompt": f"""{base_style}
STYLE: Calm Elegance - Premium wellness app aesthetic like the Calm app.
Heart with soft pink (#FF6B9D) to deep rose (#C9184A) gradient.
Subtle gradient background in lighter pink tones.
Soft 3D depth effect with gentle shading on the heart.
Matte finish, calm, sophisticated, and refined."""
        },
        {
            "name": "heartlift_icon_B_warm_glow.png",
            "prompt": f"""{base_style}
STYLE: Warm Glow - Inviting and optimistic wellness feel.
Heart with pink to warm coral-rose gradient tones.
Soft warm gradient background.
The heart has gentle depth and a warm, welcoming appearance.
Clean, bright, and premium quality."""
        },
        {
            "name": "heartlift_icon_C_deep_rose.png", 
            "prompt": f"""{base_style}
STYLE: Deep Rose Premium - Luxurious and high-end feel.
Heart with rich gradient from pink (#FF6B9D) to deep burgundy rose (#C9184A).
Subtle complementary gradient background.
More contrast and depth for a sophisticated, luxury brand look.
Refined, elegant, premium matte finish."""
        }
    ]
    
    results = []
    for icon in icons:
        result = await generate_icon(icon["prompt"], icon["name"])
        results.append({"name": icon["name"], "path": result})
    
    print("\n" + "=" * 60)
    print("📋 GENERATION SUMMARY")
    print("=" * 60)
    
    success_count = 0
    for r in results:
        status = "✅ SUCCESS" if r["path"] else "❌ FAILED"
        if r["path"]:
            success_count += 1
        print(f"   {status}: {r['name']}")
    
    print(f"\n   Generated: {success_count}/3 icons")
    print("\n📁 Icons saved to: /app/app_icons/")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

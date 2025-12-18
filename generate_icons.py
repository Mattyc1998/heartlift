"""
HeartLift Premium App Icon Generator
Generates 3 premium icon variations using OpenAI gpt-image-1
"""

import os
import requests
import base64
from datetime import datetime

# Set the Emergent LLM key
os.environ["EMERGENT_LLM_KEY"] = "sk-emergent-a8bA8F422Bb2e71BcE"

from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

def generate_icon(prompt: str, filename: str):
    """Generate an icon using OpenAI image generation"""
    print(f"\n🎨 Generating: {filename}")
    print(f"   Prompt: {prompt[:100]}...")
    
    try:
        generator = OpenAIImageGeneration(
            api_key=os.environ["EMERGENT_LLM_KEY"]
        )
        
        # Generate the image
        result = generator.generate_image(
            prompt=prompt,
            size="1024x1024",
            quality="high"
        )
        
        # Save the image
        output_path = f"/app/app_icons/{filename}"
        
        if hasattr(result, 'url') and result.url:
            # Download from URL
            response = requests.get(result.url)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"   ✅ Saved to: {output_path}")
            return output_path
        elif hasattr(result, 'b64_json') and result.b64_json:
            # Decode base64
            image_data = base64.b64decode(result.b64_json)
            with open(output_path, 'wb') as f:
                f.write(image_data)
            print(f"   ✅ Saved to: {output_path}")
            return output_path
        elif isinstance(result, str):
            # Result might be URL string
            if result.startswith('http'):
                response = requests.get(result)
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                print(f"   ✅ Saved to: {output_path}")
                return output_path
            else:
                # Might be base64
                image_data = base64.b64decode(result)
                with open(output_path, 'wb') as f:
                    f.write(image_data)
                print(f"   ✅ Saved to: {output_path}")
                return output_path
        else:
            print(f"   ❌ Unexpected result type: {type(result)}")
            print(f"   Result: {result}")
            return None
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    print("=" * 60)
    print("🚀 HeartLift Premium App Icon Generator")
    print("=" * 60)
    
    # Base style requirements for all icons
    base_style = """
    App icon design, 1024x1024 pixels, iOS app icon format.
    Single elegant heart shape, refined and premium looking.
    NO text, NO words, NO letters, NO sparkles, NO stars.
    Clean minimalist design. Matte finish look.
    Smooth gradient. Professional quality.
    The heart should be centered and fill most of the icon space.
    Rounded corners (iOS app icon style with rounded square background).
    """
    
    icons = [
        {
            "name": "heartlift_icon_A_calm_elegance.png",
            "prompt": f"""
            {base_style}
            VARIATION A - CALM ELEGANCE:
            A beautiful refined heart shape on a subtle gradient background.
            Heart color: Soft pink (#FF6B9D) gradient to deep rose (#C9184A).
            Background: Very subtle lighter pink to soft rose gradient.
            The heart has a soft 3D depth effect with subtle shading.
            Matte finish, calm and sophisticated like the Calm app icon.
            Premium wellness app aesthetic. Elegant and refined.
            """
        },
        {
            "name": "heartlift_icon_B_warm_glow.png",
            "prompt": f"""
            {base_style}
            VARIATION B - WARM GLOW:
            A beautiful refined heart shape with warm tones.
            Heart color: Pink (#FF6B9D) with hints of coral/peach warmth.
            Gradient flowing from soft pink to deeper rose-coral.
            Background: Soft warm gradient, very subtle.
            The heart has gentle depth and a warm, inviting glow.
            Clean and optimistic feel. Premium wellness aesthetic.
            """
        },
        {
            "name": "heartlift_icon_C_deep_rose.png", 
            "prompt": f"""
            {base_style}
            VARIATION C - DEEP ROSE PREMIUM:
            A beautiful refined heart shape, luxurious feel.
            Heart color: Rich gradient from pink (#FF6B9D) to deep burgundy rose (#C9184A).
            Background: Subtle gradient that complements the heart.
            The heart has sophisticated depth, slightly more contrast.
            Matte finish with premium, high-end wellness app look.
            Like a luxury brand icon. Refined and elegant.
            """
        }
    ]
    
    results = []
    for icon in icons:
        result = generate_icon(icon["prompt"], icon["name"])
        results.append({"name": icon["name"], "path": result})
    
    print("\n" + "=" * 60)
    print("📋 GENERATION SUMMARY")
    print("=" * 60)
    
    for r in results:
        status = "✅ SUCCESS" if r["path"] else "❌ FAILED"
        print(f"   {status}: {r['name']}")
    
    print("\n📁 Icons saved to: /app/app_icons/")
    print("=" * 60)

if __name__ == "__main__":
    main()

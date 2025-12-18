"""
Replace iOS app icon with new FINAL_HEARTLIFT_ICON.png
Generates all required sizes for iOS
"""

from PIL import Image
import os

# Source icon
SOURCE_ICON = "/app/app_icons/FINAL_HEARTLIFT_ICON.png"
TARGET_DIR = "/app/frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset"

# iOS required icon sizes
IOS_ICON_SIZES = [
    ("AppIcon-20x20@1x.png", 20),
    ("AppIcon-20x20@2x.png", 40),
    ("AppIcon-20x20@3x.png", 60),
    ("AppIcon-29x29@1x.png", 29),
    ("AppIcon-29x29@2x.png", 58),
    ("AppIcon-29x29@3x.png", 87),
    ("AppIcon-40x40@1x.png", 40),
    ("AppIcon-40x40@2x.png", 80),
    ("AppIcon-40x40@3x.png", 120),
    ("AppIcon-60x60@2x.png", 120),
    ("AppIcon-60x60@3x.png", 180),
    ("AppIcon-76x76@1x.png", 76),
    ("AppIcon-76x76@2x.png", 152),
    ("AppIcon-83.5x83.5@2x.png", 167),
    ("AppIcon-512@2x.png", 1024),
    ("AppIcon-1024.png", 1024),
]

def main():
    print("=" * 60)
    print("🚀 Replacing iOS App Icon")
    print("=" * 60)
    
    # Load source icon
    print(f"\n📂 Loading source: {SOURCE_ICON}")
    source = Image.open(SOURCE_ICON)
    
    # Convert to RGB if necessary (remove alpha for iOS)
    if source.mode == 'RGBA':
        # Create white background
        background = Image.new('RGB', source.size, (255, 255, 255))
        background.paste(source, mask=source.split()[3])
        source = background
    elif source.mode != 'RGB':
        source = source.convert('RGB')
    
    print(f"   Source size: {source.size}")
    print(f"   Source mode: {source.mode}")
    
    # Generate all sizes
    print(f"\n📏 Generating {len(IOS_ICON_SIZES)} icon sizes...")
    
    for filename, size in IOS_ICON_SIZES:
        output_path = os.path.join(TARGET_DIR, filename)
        
        # Resize with high-quality resampling
        resized = source.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save
        resized.save(output_path, "PNG", quality=100)
        print(f"   ✅ {filename} ({size}x{size})")
    
    print(f"\n✅ All icons replaced in: {TARGET_DIR}")
    print("=" * 60)
    print("\n📱 Next steps:")
    print("   1. Open Xcode")
    print("   2. Clean build folder (Cmd+Shift+K)")
    print("   3. Build and run your app")
    print("=" * 60)

if __name__ == "__main__":
    main()

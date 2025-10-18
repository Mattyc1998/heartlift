#!/usr/bin/env python3
"""
Generate placeholder app icons for iOS
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Icon sizes for iOS
ICON_SIZES = {
    'AppIcon-20x20@1x.png': 20,
    'AppIcon-20x20@2x.png': 40,
    'AppIcon-20x20@3x.png': 60,
    'AppIcon-29x29@1x.png': 29,
    'AppIcon-29x29@2x.png': 58,
    'AppIcon-29x29@3x.png': 87,
    'AppIcon-40x40@1x.png': 40,
    'AppIcon-40x40@2x.png': 80,
    'AppIcon-40x40@3x.png': 120,
    'AppIcon-60x60@2x.png': 120,
    'AppIcon-60x60@3x.png': 180,
    'AppIcon-76x76@1x.png': 76,
    'AppIcon-76x76@2x.png': 152,
    'AppIcon-83.5x83.5@2x.png': 167,
    'AppIcon-512@2x.png': 1024,
}

def create_icon(size, output_path):
    """Create a placeholder icon with gradient background"""
    # Create image with gradient
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Create gradient from pink to purple (HeartLift theme)
    for i in range(size):
        # Gradient from #FF6B9D (pink) to #9B59B6 (purple)
        r = int(255 - (255 - 155) * i / size)
        g = int(107 - (107 - 89) * i / size)
        b = int(157 + (182 - 157) * i / size)
        draw.rectangle([(0, i), (size, i+1)], fill=(r, g, b))
    
    # Draw a heart shape in the center
    heart_size = size // 2
    center_x, center_y = size // 2, size // 2
    
    # Simple heart using circles and a triangle
    draw.ellipse([center_x - heart_size//3, center_y - heart_size//3, 
                  center_x, center_y + heart_size//6], fill='white')
    draw.ellipse([center_x, center_y - heart_size//3, 
                  center_x + heart_size//3, center_y + heart_size//6], fill='white')
    draw.polygon([
        (center_x - heart_size//3, center_y),
        (center_x + heart_size//3, center_y),
        (center_x, center_y + heart_size//2)
    ], fill='white')
    
    # Save the icon
    img.save(output_path, 'PNG')
    print(f"Created: {output_path} ({size}x{size})")

def main():
    """Generate all required iOS icons"""
    base_path = 'ios/App/App/Assets.xcassets/AppIcon.appiconset'
    
    if not os.path.exists(base_path):
        print(f"Error: {base_path} does not exist")
        return
    
    print("Generating placeholder HeartLift icons...")
    
    for filename, size in ICON_SIZES.items():
        output_path = os.path.join(base_path, filename)
        create_icon(size, output_path)
    
    # Also create a 1024x1024 icon for App Store
    app_store_icon = os.path.join(base_path, 'AppIcon-1024.png')
    create_icon(1024, app_store_icon)
    
    print("\n✅ All placeholder icons generated successfully!")
    print("These are temporary icons. Replace with professional designs before App Store submission.")

if __name__ == '__main__':
    main()

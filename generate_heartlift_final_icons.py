#!/usr/bin/env python3
"""
Generate HeartLift app icons based on the provided design
Pink circle with white heart outline and sparkle decorations
"""

from PIL import Image, ImageDraw
import os
import math

# Define the icon sizes needed for iOS
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
    'AppIcon-1024.png': 1024,
}

OUTPUT_DIR = '/app/frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset'

def create_heartlift_icon(size):
    """Create HeartLift icon based on the provided design"""
    
    # Create image with cream/beige background
    bg_color = (250, 245, 240, 255)  # Cream/beige
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Colors
    pink = (237, 147, 172)  # Main pink circle color
    white = (255, 255, 255)
    gold = (255, 200, 100)  # Gold/yellow for sparkles
    
    # Draw main pink circle (slightly smaller than canvas for padding)
    circle_margin = int(size * 0.15)
    circle_bbox = [circle_margin, circle_margin, size - circle_margin, size - circle_margin]
    draw.ellipse(circle_bbox, fill=pink)
    
    # Draw white heart outline in center
    heart_scale = 0.35
    heart_center_x = size // 2
    heart_center_y = size // 2
    
    # Heart drawing function using bezier-like curves
    def draw_heart(draw, center_x, center_y, scale, color, width):
        # Scale for the heart
        s = int(size * scale)
        
        # Heart points (simplified geometric heart)
        # Top left bump
        left_bump_x = center_x - s // 3
        left_bump_y = center_y - s // 4
        
        # Top right bump
        right_bump_x = center_x + s // 3
        right_bump_y = center_y - s // 4
        
        # Bottom point
        bottom_x = center_x
        bottom_y = center_y + int(s * 0.4)
        
        # Draw heart as polygon outline
        # Left side of heart
        draw.arc([left_bump_x - s//3, left_bump_y - s//4, 
                  left_bump_x + s//3, left_bump_y + s//4], 
                 start=180, end=0, fill=color, width=width)
        
        # Right side of heart
        draw.arc([right_bump_x - s//3, right_bump_y - s//4,
                  right_bump_x + s//3, right_bump_y + s//4],
                 start=180, end=0, fill=color, width=width)
        
        # Left line to bottom
        draw.line([left_bump_x - s//3, left_bump_y, bottom_x, bottom_y], 
                  fill=color, width=width)
        
        # Right line to bottom
        draw.line([right_bump_x + s//3, right_bump_y, bottom_x, bottom_y],
                  fill=color, width=width)
    
    # Draw heart with appropriate line width
    line_width = max(3, int(size * 0.035))
    draw_heart(draw, heart_center_x, heart_center_y, heart_scale, white, line_width)
    
    # Add sparkles (decorative elements)
    sparkle_size = int(size * 0.08)
    
    # Top right sparkle (4-pointed star)
    def draw_sparkle(x, y, sparkle_size, color):
        # Draw a 4-pointed star/sparkle
        points = []
        for i in range(8):
            angle = i * math.pi / 4
            if i % 2 == 0:
                r = sparkle_size
            else:
                r = sparkle_size * 0.4
            px = x + int(r * math.cos(angle))
            py = y + int(r * math.sin(angle))
            points.append((px, py))
        draw.polygon(points, fill=color)
    
    # Top right sparkle
    sparkle1_x = int(size * 0.75)
    sparkle1_y = int(size * 0.25)
    draw_sparkle(sparkle1_x, sparkle1_y, sparkle_size, gold)
    
    # Bottom left sparkle (smaller)
    sparkle2_x = int(size * 0.25)
    sparkle2_y = int(size * 0.80)
    draw_sparkle(sparkle2_x, sparkle2_y, int(sparkle_size * 0.7), gold)
    
    # Small accent sparkle near top right
    if size >= 120:  # Only for larger icons
        sparkle3_x = int(size * 0.82)
        sparkle3_y = int(size * 0.18)
        draw_sparkle(sparkle3_x, sparkle3_y, int(sparkle_size * 0.5), gold)
    
    return img

def generate_all_icons():
    """Generate all required icon sizes"""
    
    print(f"🎨 Generating HeartLift app icons...")
    print(f"Output directory: {OUTPUT_DIR}")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for filename, size in ICON_SIZES.items():
        print(f"Generating {filename} ({size}x{size})...")
        icon = create_heartlift_icon(size)
        
        output_path = os.path.join(OUTPUT_DIR, filename)
        icon.save(output_path, 'PNG', optimize=True, quality=100)
        print(f"  ✓ Saved {filename}")
    
    print(f"\n✅ Successfully generated {len(ICON_SIZES)} icon files!")
    print(f"Icons saved to: {OUTPUT_DIR}")

if __name__ == '__main__':
    generate_all_icons()

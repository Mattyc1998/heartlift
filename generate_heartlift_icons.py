#!/usr/bin/env python3
"""
Generate HeartLift app icons in all required iOS sizes
Pink oval with white heart design
"""

from PIL import Image, ImageDraw
import os

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
    'AppIcon-512@2x.png': 1024,
}

OUTPUT_DIR = '/app/frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset'

def create_heart_icon(size):
    """Create a pink oval with white heart icon at specified size"""
    
    # Create image with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Pink color (from HeartLift branding)
    pink = (232, 146, 172, 255)  # #E892AC
    white = (255, 255, 255, 255)
    
    # Calculate dimensions
    padding = int(size * 0.05)
    oval_width = size - (padding * 2)
    oval_height = int(oval_width * 1.4)  # Taller oval
    
    # Center the oval vertically
    oval_top = (size - oval_height) // 2
    oval_bottom = oval_top + oval_height
    oval_left = padding
    oval_right = padding + oval_width
    
    # Draw pink oval background
    draw.ellipse(
        [oval_left, oval_top, oval_right, oval_bottom],
        fill=pink,
        outline=None
    )
    
    # Draw white heart in center
    heart_size = int(size * 0.4)
    heart_center_x = size // 2
    heart_center_y = size // 2
    
    # Heart parameters
    heart_width = heart_size
    heart_height = int(heart_size * 0.9)
    heart_left = heart_center_x - heart_width // 2
    heart_top = heart_center_y - heart_height // 2
    
    # Draw heart shape using polygon
    # Heart shape: two circles on top, triangle on bottom
    heart_points = []
    
    # Left curve of heart (top left semicircle)
    left_center_x = heart_left + heart_width // 4
    left_center_y = heart_top + heart_height // 4
    
    # Right curve of heart (top right semicircle)
    right_center_x = heart_left + 3 * heart_width // 4
    right_center_y = heart_top + heart_height // 4
    
    # Bottom point
    bottom_x = heart_center_x
    bottom_y = heart_top + heart_height
    
    # Create heart shape as outline
    line_width = max(2, int(size * 0.04))
    
    # Draw two circles at top
    circle_radius = heart_width // 4
    draw.ellipse(
        [left_center_x - circle_radius, left_center_y - circle_radius,
         left_center_x + circle_radius, left_center_y + circle_radius],
        outline=white,
        width=line_width
    )
    draw.ellipse(
        [right_center_x - circle_radius, right_center_y - circle_radius,
         right_center_x + circle_radius, right_center_y + circle_radius],
        outline=white,
        width=line_width
    )
    
    # Draw lines connecting to bottom point
    draw.line(
        [left_center_x - circle_radius, left_center_y + circle_radius // 2,
         bottom_x, bottom_y],
        fill=white,
        width=line_width
    )
    draw.line(
        [right_center_x + circle_radius, right_center_y + circle_radius // 2,
         bottom_x, bottom_y],
        fill=white,
        width=line_width
    )
    
    return img

def generate_all_icons():
    """Generate all required icon sizes"""
    
    print(f"Generating HeartLift app icons...")
    print(f"Output directory: {OUTPUT_DIR}")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for filename, size in ICON_SIZES.items():
        print(f"Generating {filename} ({size}x{size})...")
        icon = create_heart_icon(size)
        
        # Convert RGBA to RGB for PNG
        if icon.mode == 'RGBA':
            # Create white background
            background = Image.new('RGB', icon.size, (255, 255, 255))
            background.paste(icon, mask=icon.split()[3])  # Use alpha channel as mask
            icon = background
        
        output_path = os.path.join(OUTPUT_DIR, filename)
        icon.save(output_path, 'PNG', optimize=True, quality=95)
        print(f"  ✓ Saved {filename}")
    
    print(f"\n✅ Successfully generated {len(ICON_SIZES)} icon files!")
    print(f"Icons saved to: {OUTPUT_DIR}")

if __name__ == '__main__':
    generate_all_icons()

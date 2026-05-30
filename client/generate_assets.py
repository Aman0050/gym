import os
from PIL import Image
import base64
import math

input_image_path = r"C:\Users\aman.naeem\.gemini\antigravity\brain\f49bf100-cb0e-4b7e-8744-45c18416d710\refined_lion_logo_1779515019346.png"
out_transparent = "src/assets/flaming-lion-refined.png"
out_dark = "src/assets/flaming-lion-dark.png"
out_light = "src/assets/flaming-lion-light.png"
out_favicon = "public/favicon-refined.png"
out_svg = "src/assets/flaming-lion-refined.svg"

def color_distance(c1, c2):
    return math.sqrt(sum((a - b)**2 for a, b in zip(c1[:3], c2[:3])))

def process_images():
    print("Loading image:", input_image_path)
    img = Image.open(input_image_path).convert("RGBA")
    
    # 1. Create transparent PNG
    print("Removing background by color threshold...")
    transparent_img = img.copy()
    pixels = transparent_img.load()
    bg_color = (239, 239, 237)
    threshold = 25
    
    for y in range(transparent_img.height):
        for x in range(transparent_img.width):
            c = pixels[x, y]
            if color_distance(c, bg_color) < threshold:
                # Anti-aliasing edge softening could be complex here, 
                # but we'll do a simple fade for close colors.
                dist = color_distance(c, bg_color)
                if dist < threshold * 0.5:
                    pixels[x, y] = (c[0], c[1], c[2], 0)
                else:
                    alpha = int(255 * ((dist - threshold * 0.5) / (threshold * 0.5)))
                    pixels[x, y] = (c[0], c[1], c[2], alpha)
                    
    # Save the transparent image
    transparent_img.save(out_transparent)
    print("Saved transparent PNG:", out_transparent)
    
    # Crop to content and resize centered
    bbox = transparent_img.getbbox()
    if bbox:
        cropped = transparent_img.crop(bbox)
        max_dim = max(cropped.width, cropped.height)
        scale = 900 / max_dim
        new_w = int(cropped.width * scale)
        new_h = int(cropped.height * scale)
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        final_img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
        px = (1024 - new_w) // 2
        py = (1024 - new_h) // 2
        final_img.paste(resized, (px, py), resized)
    else:
        final_img = transparent_img
    
    # Re-save the final perfectly centered one
    final_img.save(out_transparent)
    
    # 3. Create Favicon version
    if bbox:
        scale_fav = 1024 / max_dim
        fw = int(cropped.width * scale_fav)
        fh = int(cropped.height * scale_fav)
        fav_resized = cropped.resize((fw, fh), Image.Resampling.LANCZOS)
        fav_img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
        fpx = (1024 - fw) // 2
        fpy = (1024 - fh) // 2
        fav_img.paste(fav_resized, (fpx, fpy), fav_resized)
        fav_img.save(out_favicon)
        fav_img.save("public/favicon.png")
        print("Saved favicon:", out_favicon)
    
    # 4. Create Monochrome Dark Version
    dark_img = final_img.copy()
    dpixels = dark_img.load()
    for y in range(dark_img.height):
        for x in range(dark_img.width):
            r, g, b, a = dpixels[x, y]
            if a > 0:
                dpixels[x, y] = (17, 17, 17, a)
    dark_img.save(out_dark)
    print("Saved monochrome dark:", out_dark)
    
    # 5. Create Monochrome Light Version
    light_img = final_img.copy()
    lpixels = light_img.load()
    for y in range(light_img.height):
        for x in range(light_img.width):
            r, g, b, a = lpixels[x, y]
            if a > 0:
                lpixels[x, y] = (248, 248, 248, a)
    light_img.save(out_light)
    print("Saved monochrome light:", out_light)
    
    # 6. Create SVG
    try:
        import vtracer
        print("Using vtracer to generate SVG...")
        vtracer.convert_image_to_svg_py(out_transparent, out_svg, colormode="color", mode="polygon")
        print("Saved SVG:", out_svg)
    except Exception as e:
        print("vtracer failed or not found, creating base64 SVG instead...", e)
        with open(out_transparent, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <image href="data:image/png;base64,{b64}" width="1024" height="1024" />
</svg>'''
        with open(out_svg, "w") as f:
            f.write(svg_content)
        print("Saved base64 SVG:", out_svg)

if __name__ == "__main__":
    process_images()

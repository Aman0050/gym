import os
import numpy as np
from PIL import Image

TARGET_COLOR = (160, 82, 45) # #a0522d

def rgb_to_hsv(rgb):
    # rgb is a numpy array of shape (..., 3) with values in [0, 255]
    rgb = rgb.astype('float32') / 255.0
    out = np.empty_like(rgb)
    
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    maxc = np.max(rgb, axis=-1)
    minc = np.min(rgb, axis=-1)
    v = maxc
    
    deltac = maxc - minc
    s = np.zeros_like(maxc)
    s[maxc > 0] = deltac[maxc > 0] / maxc[maxc > 0]
    
    h = np.zeros_like(maxc)
    
    # Calculate H
    idx = (maxc == r) & (deltac > 0)
    h[idx] = (g[idx] - b[idx]) / deltac[idx]
    
    idx = (maxc == g) & (deltac > 0)
    h[idx] = 2.0 + (b[idx] - r[idx]) / deltac[idx]
    
    idx = (maxc == b) & (deltac > 0)
    h[idx] = 4.0 + (r[idx] - g[idx]) / deltac[idx]
    
    h = (h / 6.0) % 1.0
    
    return h, s, v

def process_logo(image_path):
    print(f"Processing {image_path}...")
    try:
        img = Image.open(image_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to open {image_path}: {e}")
        return

    data = np.array(img)

    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    h, s, v = rgb_to_hsv(data[:,:,:3])

    # Orange hue is typically between 0.02 and 0.15
    # The logo has neon orange and yellowish glow, so maybe hue up to 0.18
    # Saturation should be relatively high to exclude white/grey anti-aliasing
    
    is_orange = (h > 0.01) & (h < 0.18) & (s > 0.3) & (v > 0.2)
    
    # The user says "Remove from logo: glow, strong highlights, shine overlays, reflections"
    # To do this, we map all 'is_orange' pixels strictly to TARGET_COLOR.
    # This creates a perfectly flat shape where the orange was, removing the gradients entirely.
    # To keep edges smooth, we preserve the original alpha channel.
    
    data[is_orange, 0] = TARGET_COLOR[0]
    data[is_orange, 1] = TARGET_COLOR[1]
    data[is_orange, 2] = TARGET_COLOR[2]
    
    # To remove the 'glow' effect around the logo (which might be low-alpha orange pixels)
    # we can reduce alpha for these pixels if they are very transparent.
    # Or maybe just replacing the neon orange with the darker a0522d naturally removes the bright glow.
    # But let's aggressively remove the glow: if it's an orange pixel and alpha is less than 150, 
    # we can drop its alpha drastically so the glow disappears, keeping only the solid shape.
    glow_mask = is_orange & (a < 180) & (a > 0)
    # dampen the alpha to remove the glow but keep a tiny bit for anti-aliasing
    data[glow_mask, 3] = (data[glow_mask, 3] * 0.3).astype(np.uint8)

    # Let's also deal with any stray bright pixels that might have low saturation but are part of the reflection
    # If the reflection is pure white (s < 0.3, v > 0.8), but it's physically on the orange part...
    # Without a spatial mask, replacing white is risky since the letters "FITNEXO" are white/silver!
    # Let's see if the first pass is enough.

    out_img = Image.fromarray(data)
    out_img.save(image_path)
    print(f"Saved {image_path}")

paths = [
    r"d:\Aman Prrogramming\GYM\client\public\fitnexo_logo_full.png",
    r"d:\Aman Prrogramming\GYM\client\public\fitnexo_logo_transparent.png",
    r"d:\Aman Prrogramming\GYM\client\src\assets\fitnexo_logo.png",
    r"d:\Aman Prrogramming\GYM\client\src\assets\fitxeno_logo.png",
    r"d:\Aman Prrogramming\GYM\client\src\assets\fitxeno_logo_full.png",
    r"d:\Aman Prrogramming\GYM\client\src\assets\logo-fitxeno.png"
]

for p in paths:
    if os.path.exists(p):
        process_logo(p)

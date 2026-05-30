import os
from PIL import Image

input_image_path = r"C:\Users\aman.naeem\.gemini\antigravity\brain\f49bf100-cb0e-4b7e-8744-45c18416d710\refined_lion_logo_1779515019346.png"

def check_bg():
    img = Image.open(input_image_path).convert("RGBA")
    print(f"Image size: {img.size}")
    colors = img.getcolors(1000000)
    bg_color = max(colors, key=lambda x: x[0])[1]
    print(f"Most common color (bg?): {bg_color}")
    
check_bg()

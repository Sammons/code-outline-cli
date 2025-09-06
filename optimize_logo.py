#!/usr/bin/env python3
from PIL import Image
import os

# Open the original logo
img = Image.open('logo_original.png')
print(f"Original size: {os.path.getsize('logo_original.png') / 1024 / 1024:.2f} MB")
print(f"Original dimensions: {img.size}")
print(f"Original mode: {img.mode}")

# Method 1: Reduce quality and optimize
img.save('logo_optimized.png', 'PNG', optimize=True, quality=85)
size1 = os.path.getsize('logo_optimized.png') / 1024 / 1024
print(f"Optimized size: {size1:.2f} MB")

# Method 2: Resize if still too large
if size1 >= 1.0:
    # Reduce dimensions slightly (90% of original)
    new_size = (int(img.width * 0.9), int(img.height * 0.9))
    img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
    img_resized.save('logo_optimized.png', 'PNG', optimize=True, quality=85)
    size2 = os.path.getsize('logo_optimized.png') / 1024 / 1024
    print(f"Resized to {new_size}, new size: {size2:.2f} MB")
    
    # Method 3: More aggressive resize if needed
    if size2 >= 1.0:
        new_size = (800, 800)
        img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
        img_resized.save('logo_optimized.png', 'PNG', optimize=True, quality=80)
        size3 = os.path.getsize('logo_optimized.png') / 1024 / 1024
        print(f"Resized to {new_size}, new size: {size3:.2f} MB")

# Save final version back to Downloads
import shutil
shutil.copy('logo_optimized.png', '/mnt/c/Users/bsamm/Downloads/logo_optimized.png')
print(f"\nOptimized logo saved to: C:\\Users\\bsamm\\Downloads\\logo_optimized.png")
"""
Complete sprite processing pipeline:
1. Flood-fill background removal (from edges)
2. Crop watermark area (bottom)
3. Resize to uniform square with transparent background

Usage: python process_sprite.py [directory] [crop_bottom] [target_square_size]
Defaults: crop_bottom=65, target_square_size=1024
"""

import os
import sys
from collections import deque
from PIL import Image


def flood_fill_remove_bg(img, threshold=50):
    img = img.convert('RGBA')
    w, h = img.size
    pixels = img.load()

    visited = [[False] * w for _ in range(h)]
    queue = deque()

    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    ref_colors = [
        pixels[0, 0][:3],
        pixels[w-1, 0][:3],
        pixels[0, h-1][:3],
        pixels[w-1, h-1][:3]
    ]

    def is_bg_color(r, g, b):
        for ref in ref_colors:
            diff = abs(r - ref[0]) + abs(g - ref[1]) + abs(b - ref[2])
            if diff < threshold:
                return True
        brightness = (r + g + b) / 3
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        saturation = max_c - min_c
        if brightness > 160 and saturation < 40:
            return True
        return False

    while queue:
        x, y = queue.popleft()
        if visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = pixels[x, y]
        if a == 0:
            continue
        if is_bg_color(r, g, b):
            pixels[x, y] = (r, g, b, 0)
            for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                    queue.append((nx, ny))

    return img


def find_content_bounds(img):
    w, h = img.size
    pixels = img.load()
    top = h; bottom = 0; left = w; right = 0
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > 10:
                top = min(top, y)
                bottom = max(bottom, y)
                left = min(left, x)
                right = max(right, x)
    if top > bottom:
        return None
    return (left, top, right, bottom)


def process_sprite(input_path, output_path=None, crop_bottom=65, target_size=1024):
    img = Image.open(input_path)
    img = img.convert('RGBA')

    img = flood_fill_remove_bg(img, threshold=50)

    w, h = img.size
    if crop_bottom > 0:
        img = img.crop((0, 0, w, h - crop_bottom))

    bounds = find_content_bounds(img)
    if bounds is None:
        print(f"  [SKIP] {os.path.basename(input_path)} - no content")
        return None

    left, top, right, bottom = bounds
    content_w = right - left + 1
    content_h = bottom - top + 1
    content = img.crop((left, top, right + 1, bottom + 1))

    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    max_fill = int(target_size * 0.8)
    scale = min(max_fill / content_w, max_fill / content_h)
    new_w = int(content_w * scale)
    new_h = int(content_h * scale)
    scaled = content.resize((new_w, new_h), Image.LANCZOS)

    x_offset = (target_size - new_w) // 2
    y_offset = (target_size - new_h) // 2
    canvas.paste(scaled, (x_offset, y_offset), scaled)

    if output_path is None:
        output_path = input_path
    canvas.save(output_path, 'PNG')

    return {
        'original_size': (w, h),
        'final_size': (target_size, target_size),
    }


def batch_process(directory, crop_bottom=65, target_size=1024):
    files = [f for f in os.listdir(directory) if f.lower().endswith('.png')]

    print(f"[DIR] {directory}")
    print(f"[CROP] bottom {crop_bottom}px")
    print(f"[TARGET] {target_size}x{target_size} square")
    print(f"[COUNT] {len(files)}\n")

    for f in sorted(files):
        path = os.path.join(directory, f)
        result = process_sprite(path, crop_bottom=crop_bottom, target_size=target_size)
        if result:
            print(f"  [OK] {f}: {result['original_size']} -> {result['final_size']}")
        else:
            print(f"  [FAIL] {f}")

    print(f"\n[DONE]")


if __name__ == '__main__':
    directory = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
    crop_bottom = int(sys.argv[2]) if len(sys.argv) > 2 else 65
    target_size = int(sys.argv[3]) if len(sys.argv) > 3 else 1024

    if not os.path.isdir(directory):
        print(f"[ERROR] {directory}")
        sys.exit(1)

    batch_process(directory, crop_bottom, target_size)
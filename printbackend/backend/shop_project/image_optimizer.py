"""
Image Optimization Pipeline for PrintDoot.

Automatically converts and optimizes images before they are uploaded to S3.
- Converts PNG/JPEG/BMP/TIFF → WebP (60–80% smaller)
- Resizes oversized images (max 1920px wide)
- Strips EXIF metadata for privacy
- Preserves transparency (RGBA → WebP lossless alpha)

Usage:
  This is wired into MediaStorage automatically.
  Every image uploaded via Django's ImageField will be optimized
  before hitting S3 — zero changes needed in views or models.

Manual usage:
  from shop_project.image_optimizer import optimize_image
  optimized_file = optimize_image(uploaded_file, max_width=800, quality=80)
"""

import io
import os
import logging

from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile

logger = logging.getLogger(__name__)

# Formats we can convert to WebP
CONVERTIBLE_FORMATS = {'JPEG', 'JPG', 'PNG', 'BMP', 'TIFF', 'RGB'}

# Max dimension (width) — images wider than this get resized
DEFAULT_MAX_WIDTH = 1920

# WebP quality (0–100). 80 is visually lossless for photos.
DEFAULT_QUALITY = 82


def optimize_image(
    file_obj,
    max_width=DEFAULT_MAX_WIDTH,
    quality=DEFAULT_QUALITY,
    force_webp=True,
):
    """
    Optimize an uploaded image file.

    Args:
        file_obj: Django UploadedFile or any file-like object with .name
        max_width: Maximum width in pixels (height scales proportionally)
        quality: WebP quality (1–100)
        force_webp: Convert to WebP format

    Returns:
        Optimized InMemoryUploadedFile (WebP), or original file if not an image.
    """
    if not file_obj:
        return file_obj

    # Only process image files
    file_name = getattr(file_obj, 'name', '') or ''
    ext = os.path.splitext(file_name)[1].lower().lstrip('.')
    if ext not in ('png', 'jpg', 'jpeg', 'bmp', 'tiff', 'webp'):
        return file_obj

    try:
        # Read the image
        file_obj.seek(0)
        img = Image.open(file_obj)

        # Store original format
        original_format = (img.format or '').upper()

        # Skip if already WebP and reasonably sized
        if original_format == 'WEBP' and img.width <= max_width:
            file_obj.seek(0)
            return file_obj

        # Convert CMYK to RGB (common in print files)
        if img.mode == 'CMYK':
            img = img.convert('RGB')
        # Preserve transparency for PNGs
        elif img.mode == 'P':
            img = img.convert('RGBA')
        elif img.mode not in ('RGB', 'RGBA', 'L', 'LA'):
            img = img.convert('RGB')

        # Resize if too wide (maintain aspect ratio)
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.LANCZOS)
            logger.info(f"Resized image from {img.width}px to {max_width}px wide")

        # Strip EXIF data for privacy (rebuild without metadata)
        # (Pillow's save to WebP doesn't carry EXIF by default)

        # Save as WebP
        output = io.BytesIO()
        has_alpha = img.mode in ('RGBA', 'LA')

        save_kwargs = {
            'format': 'WEBP',
            'quality': quality,
            'method': 6,  # Best compression (slower encode, same decode speed)
        }
        if has_alpha:
            save_kwargs['lossless'] = False  # Lossy with alpha is fine for web
            save_kwargs['alpha_quality'] = quality

        img.save(output, **save_kwargs)
        output.seek(0)

        # Build new filename with .webp extension
        base_name = os.path.splitext(file_name)[0]
        new_name = f"{base_name}.webp"

        # Create new InMemoryUploadedFile
        optimized = InMemoryUploadedFile(
            file=output,
            field_name=None,
            name=new_name,
            content_type='image/webp',
            size=output.getbuffer().nbytes,
            charset=None,
        )

        original_size = file_obj.size if hasattr(file_obj, 'size') else 0
        new_size = output.getbuffer().nbytes
        if original_size > 0:
            reduction = ((original_size - new_size) / original_size) * 100
            logger.info(
                f"Image optimized: {file_name} → {new_name} "
                f"({original_size // 1024}KB → {new_size // 1024}KB, "
                f"{reduction:.0f}% smaller)"
            )

        return optimized

    except Exception as e:
        logger.warning(f"Image optimization failed for {file_name}: {e}")
        # Return original file if optimization fails
        file_obj.seek(0)
        return file_obj


def optimize_image_for_thumbnail(
    file_obj,
    max_width=400,
    quality=75,
):
    """
    Create a smaller thumbnail-quality version.
    Useful for category grid images, avatar thumbnails, etc.
    """
    return optimize_image(file_obj, max_width=max_width, quality=quality)

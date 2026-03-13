"""
Custom S3 storage backends for PrintDoot.

Organizes uploads into clean S3 paths:
  - media/avatars/
  - media/categories/
  - media/subcategories/
  - media/designs/previews/
  - media/designs/templates/
  - media/designs/assets/
  - media/designs/fonts/
  - media/orders/print_files/
  - media/orders/invoices/

Image Optimization Pipeline:
  All images uploaded through MediaStorage are automatically converted to
  optimized WebP format before being stored in S3. This reduces image sizes
  by 60–80% with no visible quality loss, dramatically improving page load.

Usage in models:
    from shop_project.storage_backends import MediaStorage
    avatar = models.ImageField(upload_to='avatars/', storage=MediaStorage())

Or set as DEFAULT_FILE_STORAGE globally in settings.py.
"""

import os
import logging

from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings

logger = logging.getLogger(__name__)

# Image extensions that should be optimized
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'}

# Extensions that should NOT be optimized (fonts, documents, etc.)
SKIP_EXTENSIONS = {'.ttf', '.otf', '.woff', '.woff2', '.pdf', '.svg', '.zip'}


class MediaStorage(S3Boto3Storage):
    """
    S3 storage for all user-uploaded media.
    Files go under the 'media/' prefix in the bucket.
    Public read access is controlled by the bucket policy (not ACLs).

    Includes automatic image optimization:
    - Converts PNG/JPEG/BMP → WebP
    - Resizes images wider than 1920px
    - Strips EXIF metadata
    """
    location = 'media'
    file_overwrite = False
    default_acl = None          # ACLs disabled — bucket policy handles access
    querystring_auth = False    # No signed URLs — public media

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('bucket_name', getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None))
        super().__init__(*args, **kwargs)

    def _save(self, name, content):
        """
        Override _save to optimize images before uploading to S3.
        """
        ext = os.path.splitext(name)[1].lower()

        if ext in IMAGE_EXTENSIONS and ext not in SKIP_EXTENSIONS:
            try:
                from shop_project.image_optimizer import optimize_image
                optimized = optimize_image(content)

                # Update the filename if format changed (e.g., .png → .webp)
                if hasattr(optimized, 'name') and optimized.name:
                    new_ext = os.path.splitext(optimized.name)[1].lower()
                    if new_ext and new_ext != ext:
                        name = os.path.splitext(name)[0] + new_ext

                content = optimized
            except Exception as e:
                logger.warning(f"Image optimization skipped for {name}: {e}")
                # Continue with original file if optimization fails

        return super()._save(name, content)


class PrivateMediaStorage(S3Boto3Storage):
    """
    S3 storage for private/sensitive files (invoices, print files).
    Uses signed URLs with expiry for secure access.
    """
    location = 'private'
    file_overwrite = False
    default_acl = None          # ACLs disabled — bucket policy handles access
    querystring_auth = True
    querystring_expire = 3600  # 1 hour

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('bucket_name', getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None))
        super().__init__(*args, **kwargs)

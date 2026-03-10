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

Usage in models:
    from shop_project.storage_backends import MediaStorage
    avatar = models.ImageField(upload_to='avatars/', storage=MediaStorage())

Or set as DEFAULT_FILE_STORAGE globally in settings.py.
"""

from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings


class MediaStorage(S3Boto3Storage):
    """
    S3 storage for all user-uploaded media.
    Files go under the 'media/' prefix in the bucket.
    Public read access is controlled by the bucket policy (not ACLs).
    """
    location = 'media'
    file_overwrite = False
    default_acl = None          # ACLs disabled — bucket policy handles access
    querystring_auth = False    # No signed URLs — public media

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('bucket_name', getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None))
        super().__init__(*args, **kwargs)


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

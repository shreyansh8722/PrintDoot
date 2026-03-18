from django.db import migrations


class Migration(migrations.Migration):
    """
    Performance indexes for frequently filtered fields.
    These turn full table scans into index scans for common queries.
    """
    dependencies = [
        ('catalog', '0009_product_order_count_product_view_count'),
    ]

    operations = [
        # Category indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_category_is_active ON catalog_category (is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_category_is_active;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_category_display_order ON catalog_category (display_order);",
            reverse_sql="DROP INDEX IF EXISTS idx_category_display_order;",
        ),

        # Subcategory indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_subcategory_is_active ON catalog_subcategory (is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_subcategory_is_active;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_subcategory_category ON catalog_subcategory (category_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_subcategory_category;",
        ),

        # Product indexes — most impactful
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_is_active ON catalog_product (is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_is_active;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_is_featured ON catalog_product (is_featured) WHERE is_featured = true;",
            reverse_sql="DROP INDEX IF EXISTS idx_product_is_featured;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_created_at ON catalog_product (created_at DESC) WHERE is_active = true;",
            reverse_sql="DROP INDEX IF EXISTS idx_product_created_at;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_view_count ON catalog_product (view_count DESC) WHERE is_active = true;",
            reverse_sql="DROP INDEX IF EXISTS idx_product_view_count;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_subcategory ON catalog_product (subcategory_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_subcategory;",
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_order_count ON catalog_product (order_count DESC) WHERE is_active = true;",
            reverse_sql="DROP INDEX IF EXISTS idx_product_order_count;",
        ),
    ]

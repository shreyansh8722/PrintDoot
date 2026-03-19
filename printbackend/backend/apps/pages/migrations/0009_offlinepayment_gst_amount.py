from django.db import migrations, connection


def add_gst_amount_column(apps, schema_editor):
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages_offlinepayment' AND column_name = 'gst_amount')"
        )
        exists = cursor.fetchone()[0]
    if not exists:
        schema_editor.execute(
            'ALTER TABLE "pages_offlinepayment" ADD COLUMN "gst_amount" numeric(12,2) NOT NULL DEFAULT 0'
        )


class Migration(migrations.Migration):
    dependencies = [
        ('pages', '0008_promocode'),
    ]
    operations = [
        migrations.RunPython(add_gst_amount_column, migrations.RunPython.noop),
    ]


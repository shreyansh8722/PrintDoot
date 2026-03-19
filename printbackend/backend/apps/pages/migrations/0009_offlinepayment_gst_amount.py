from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0008_promocode'),
    ]

    operations = [
        migrations.AddField(
            model_name='offlinepayment',
            name='gst_amount',
            field=models.DecimalField(decimal_places=2, default=0, help_text='GST collected on this transaction (₹)', max_digits=12),
        ),
    ]

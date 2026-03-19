from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0010_performance_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='banner_image',
            field=models.URLField(blank=True, default='', help_text='S3 URL for the category page banner image', max_length=1000),
        ),
    ]

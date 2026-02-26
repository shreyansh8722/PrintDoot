from django.contrib import admin
from .models import ZakekeProduct


@admin.register(ZakekeProduct)
class ZakekeProductAdmin(admin.ModelAdmin):
    list_display = ('product', 'zakeke_product_id', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('product__name', 'zakeke_product_id')
    readonly_fields = ('created_at', 'updated_at')

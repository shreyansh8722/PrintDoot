from django.contrib import admin
from .models import Font, Asset, SavedDesign, Template

@admin.register(Font)
class FontAdmin(admin.ModelAdmin):
    list_display = ('name', 'family', 'weight', 'style', 'is_active')
    list_filter = ('is_active',)

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'user', 'type', 'uploaded_at')
    list_filter = ('type',)
    search_fields = ('original_filename', 'user__email')

@admin.register(SavedDesign)
class SavedDesignAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'product', 'version', 'is_template', 'created_at')
    list_filter = ('is_template',)
    search_fields = ('name', 'user__email', 'product__name')

@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'product', 'subcategory', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'product__name')

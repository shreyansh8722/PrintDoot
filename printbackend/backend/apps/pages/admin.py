from django.contrib import admin
from .models import LegalPage, Offer


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ['text', 'icon', 'is_active', 'display_order', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['text']
    list_editable = ['is_active', 'display_order']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['display_order', '-created_at']


@admin.register(LegalPage)
class LegalPageAdmin(admin.ModelAdmin):
    list_display = ['title', 'page_type', 'slug', 'is_published', 'updated_at']
    list_filter = ['page_type', 'is_published']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['is_published']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Page Info', {
            'fields': ('title', 'slug', 'page_type', 'is_published')
        }),
        ('Content', {
            'fields': ('content',),
            'description': 'You can use HTML tags for formatting (e.g. <h2>, <p>, <ul>, <li>, <strong>, <em>, <a>).'
        }),
        ('SEO', {
            'fields': ('meta_description',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

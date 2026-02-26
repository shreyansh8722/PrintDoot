from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Address, PasswordResetToken, EmailVerificationToken


# ========================================
# Role Admin
# ========================================
@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'description', 'created_at']
    search_fields = ['name']


# ========================================
# User Admin (extended from Django's UserAdmin)
# ========================================
class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    fields = ['type', 'recipient_name', 'city', 'state', 'zip_code', 'country', 'is_default']
    readonly_fields = []


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'is_staff', 'date_joined']
    list_filter = ['is_verified', 'is_staff', 'is_superuser', 'is_active', 'role']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    inlines = [AddressInline]

    # Extend the default fieldsets with our custom fields
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Business Info', {'fields': ('role', 'phone', 'company_name', 'tax_id')}),
        ('Verification & Status', {'fields': ('is_verified', 'marketing_opt_in', 'last_login_ip', 'avatar')}),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('email', 'first_name', 'last_name', 'phone', 'role')}),
    )


# ========================================
# Address Admin
# ========================================
@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'recipient_name', 'city', 'state', 'zip_code', 'country', 'is_default']
    list_filter = ['type', 'is_default', 'country']
    search_fields = ['recipient_name', 'city', 'zip_code', 'user__username', 'user__email']
    raw_id_fields = ['user']


# ========================================
# Token Admin
# ========================================
@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'token', 'created_at', 'used', 'is_expired']
    list_filter = ['used']
    search_fields = ['user__email', 'user__username']
    raw_id_fields = ['user']
    readonly_fields = ['token', 'created_at']

    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'token', 'created_at', 'used', 'is_expired']
    list_filter = ['used']
    search_fields = ['user__email', 'user__username']
    raw_id_fields = ['user']
    readonly_fields = ['token', 'created_at']

    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True

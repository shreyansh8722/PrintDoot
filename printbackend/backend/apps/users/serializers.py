from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils.html import strip_tags
from .models import User, Role, Address, PasswordResetToken, EmailVerificationToken
import re

# Regex for detecting common XSS/injection patterns
SUSPICIOUS_PATTERNS = re.compile(
    r'<script|javascript:|on\w+\s*=|eval\(|document\.|window\.',
    re.IGNORECASE
)


def sanitize_text(value, field_name='field'):
    """Strip HTML tags and check for XSS patterns in text input."""
    if not isinstance(value, str):
        return value
    # Check for suspicious patterns before stripping
    if SUSPICIOUS_PATTERNS.search(value):
        raise serializers.ValidationError(
            f"Invalid characters detected in {field_name}."
        )
    # Strip HTML tags
    return strip_tags(value).strip()


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']


class AddressSerializer(serializers.ModelSerializer):
    # Read-only pincode info returned after validation
    pincode_info = serializers.SerializerMethodField()

    class Meta:
        model = Address
        fields = [
            'id', 'type', 'is_default',
            'company_name', 'recipient_name', 'phone_number',
            'street', 'apartment_suite', 'city', 'state', 'zip_code', 'country',
            'pincode_info',
        ]
        read_only_fields = ['id', 'user']

    def get_pincode_info(self, obj):
        """Return serviceability info for this address's pincode."""
        from apps.orders.models import PincodeServiceability
        try:
            entry = PincodeServiceability.objects.get(pincode=obj.zip_code, is_active=True)
            return {
                'serviceable': True,
                'city': entry.city,
                'state': entry.state,
                'cod_available': entry.cod_available,
            }
        except PincodeServiceability.DoesNotExist:
            return {'serviceable': False}

    def validate_zip_code(self, value):
        """Validate pincode format. Serviceability is checked at checkout, not here."""
        import re
        value = value.strip()
        if not re.match(r'^\d{4,10}$', value):
            raise serializers.ValidationError(
                "Please enter a valid pincode (digits only, 4-10 characters)."
            )
        return value

    def create(self, validated_data):
        # Auto-assign user from context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'avatar', 'company_name', 'tax_id', 'is_active',
            'role', 'addresses',
            'is_verified', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'is_verified', 'date_joined', 'last_login']

    def get_avatar(self, obj):
        """Return absolute URL for avatar — works with both local storage and S3."""
        if not obj.avatar:
            return None
        url = obj.avatar.url
        if url.startswith('http'):
            return url  # Already absolute (S3)
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'}, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'company_name', 'phone']

    def validate_username(self, value):
        value = sanitize_text(value, 'username')
        # Only allow alphanumeric, underscores, hyphens
        if not re.match(r'^[\w\-\.]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, underscores, hyphens, and dots."
            )
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters.")
        if len(value) > 30:
            raise serializers.ValidationError("Username must be 30 characters or fewer.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower().strip()

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_first_name(self, value):
        return sanitize_text(value, 'first_name') if value else value

    def validate_last_name(self, value):
        return sanitize_text(value, 'last_name') if value else value

    def validate_company_name(self, value):
        return sanitize_text(value, 'company_name') if value else value

    def validate_phone(self, value):
        if value:
            # Only allow digits, spaces, +, -, ()
            cleaned = re.sub(r'[\s\-\(\)\+]', '', value)
            if not cleaned.isdigit() or len(cleaned) < 7 or len(cleaned) > 15:
                raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            company_name=validated_data.get('company_name', ''),
        )
        # Create email verification token for the new user
        EmailVerificationToken.objects.create(user=user)
        return user


# ========================================
# Password Reset Serializers
# ========================================
class ChangePasswordSerializer(serializers.Serializer):
    """Authenticated user changes their password by providing old + new password."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'New passwords do not match.'})
        validate_password(data['new_password'], self.context['request'].user)
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    """Step 1: User submits email → backend generates token and sends email."""
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            # Don't reveal whether the email exists — return success silently
            self.user = None
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Step 2: User submits token + new password → backend resets password."""
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        validate_password(data['password'])
        try:
            self.reset_token = PasswordResetToken.objects.select_related('user').get(token=data['token'])
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({'token': 'Invalid or expired reset token.'})
        if not self.reset_token.is_valid:
            raise serializers.ValidationError({'token': 'This reset link has expired or already been used.'})
        return data


# ========================================
# Email Verification Serializer
# ========================================
class EmailVerifySerializer(serializers.Serializer):
    """User submits token → backend marks email as verified."""
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            self.verify_token = EmailVerificationToken.objects.select_related('user').get(token=value)
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError('Invalid verification token.')
        if not self.verify_token.is_valid:
            raise serializers.ValidationError('This verification link has expired or already been used.')
        return value


# ========================================
# Avatar Upload Serializer
# ========================================
class AvatarUploadSerializer(serializers.Serializer):
    """Handles avatar image upload."""
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        # Limit to 5 MB
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Avatar image must be under 5 MB.')
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(f'Unsupported image type. Allowed: JPEG, PNG, WebP, GIF.')
        return value


# ========================================
# Pincode Validation Serializer (standalone check)
# ========================================
class PincodeCheckSerializer(serializers.Serializer):
    """Check if a pincode is serviceable — used for standalone validation without creating an address."""
    pincode = serializers.CharField(max_length=10)

    def validate_pincode(self, value):
        # Only allow numeric pincodes
        if not value.isdigit():
            raise serializers.ValidationError("Pincode must contain only digits.")
        if len(value) < 4 or len(value) > 10:
            raise serializers.ValidationError("Invalid pincode length.")
        from apps.orders.models import PincodeServiceability
        try:
            entry = PincodeServiceability.objects.get(pincode=value, is_active=True)
            self.pincode_data = {
                'serviceable': True,
                'city': entry.city,
                'state': entry.state,
                'zone': entry.zone.name,
                'cod_available': entry.cod_available,
                'standard_available': entry.standard_available,
                'express_available': entry.express_available,
                'priority_available': entry.priority_available,
            }
        except PincodeServiceability.DoesNotExist:
            self.pincode_data = {'serviceable': False}
        return value


# ========================================
# Contact Form Serializer
# ========================================
class ContactFormSerializer(serializers.Serializer):
    """Handles contact form submissions from the frontend."""
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField(max_length=5000)
    inquiry_type = serializers.ChoiceField(choices=[
        ('general', 'General Inquiry'),
        ('order', 'Order Related'),
        ('design', 'Design Help'),
        ('technical', 'Technical Support'),
        ('bulk', 'Bulk Order'),
        ('feedback', 'Feedback'),
    ], default='general')

    def validate_name(self, value):
        return sanitize_text(value, 'name')

    def validate_subject(self, value):
        return sanitize_text(value, 'subject')

    def validate_message(self, value):
        return sanitize_text(value, 'message')

    def validate_phone(self, value):
        if value:
            cleaned = re.sub(r'[\s\-\(\)\+]', '', value)
            if not cleaned.isdigit() or len(cleaned) < 7 or len(cleaned) > 15:
                raise serializers.ValidationError("Enter a valid phone number.")
        return value

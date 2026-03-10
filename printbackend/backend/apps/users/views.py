from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.mail import send_mail
from django.conf import settings
from shop_project.throttles import (
    RegisterThrottle, LoginThrottle, PasswordResetThrottle, ContactFormThrottle,
)
from .models import User, Address, PasswordResetToken, EmailVerificationToken
from .serializers import (
    UserSerializer, UserRegistrationSerializer, AddressSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    EmailVerifySerializer, AvatarUploadSerializer, PincodeCheckSerializer,
    ChangePasswordSerializer, ContactFormSerializer,
)

import logging
security_logger = logging.getLogger('security')


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class UserViewSet(mixins.RetrieveModelMixin,
                  mixins.UpdateModelMixin,
                  viewsets.GenericViewSet):
    """
    API for retrieving and updating the current user's profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

    def get_object(self):
        return self.request.user

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Get or update current user profile.
        Endpoints: GET /api/v1/users/me/ | PATCH /api/v1/users/me/
        """
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        else:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny],
            throttle_classes=[RegisterThrottle],
            serializer_class=UserRegistrationSerializer)
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Log registration for security audit
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')
        security_logger.info(f"New user registered: {user.username} ({user.email}) from IP: {ip}")
        # Send verification email
        _send_verification_email(user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
        serializer_class=AvatarUploadSerializer,
        url_path='upload-avatar',
    )
    def upload_avatar(self, request):
        """
        Upload or update user avatar.
        Endpoint: POST /api/v1/users/upload-avatar/
        Content-Type: multipart/form-data
        Works with both local storage and S3.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Delete old avatar file if it exists (works for both local & S3)
        if request.user.avatar:
            request.user.avatar.delete(save=False)
        request.user.avatar = serializer.validated_data['avatar']
        request.user.save(update_fields=['avatar'])

        # Build the correct URL regardless of storage backend
        avatar_url = request.user.avatar.url
        if not avatar_url.startswith('http'):
            avatar_url = request.build_absolute_uri(avatar_url)

        return Response({
            'message': 'Avatar uploaded successfully.',
            'avatar': avatar_url,
        })

    @action(
        detail=False,
        methods=['delete'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='remove-avatar',
    )
    def remove_avatar(self, request):
        """
        Remove user avatar.
        Endpoint: DELETE /api/v1/users/remove-avatar/
        """
        if request.user.avatar:
            request.user.avatar.delete(save=False)
            request.user.avatar = None
            request.user.save(update_fields=['avatar'])
        return Response({'message': 'Avatar removed.'})

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated],
        serializer_class=ChangePasswordSerializer,
        url_path='change-password',
    )
    def change_password(self, request):
        """
        Change the authenticated user's password.
        Endpoint: POST /api/v1/users/change-password/
        Accepts: { "old_password": "...", "new_password": "...", "new_password_confirm": "..." }
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully.'})


class AddressViewSet(viewsets.ModelViewSet):
    """
    CRUD for user addresses. Automatically filters by logged-in user.
    """
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return self.request.user.addresses.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ========================================
# Password Reset Views
# ========================================
class PasswordResetRequestView(APIView):
    """
    POST /api/v1/auth/password-reset/
    Accepts: { "email": "user@example.com" }
    Always returns 200 to avoid email enumeration.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        if user:
            # Invalidate previous tokens
            PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
            token_obj = PasswordResetToken.objects.create(user=user)
            _send_password_reset_email(user, token_obj.token)
            ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')
            security_logger.info(f"Password reset requested for: {user.email} from IP: {ip}")
        # Always return success to prevent email enumeration
        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        })


class PasswordResetConfirmView(APIView):
    """
    POST /api/v1/auth/password-reset/confirm/
    Accepts: { "token": "uuid", "password": "...", "password_confirm": "..." }
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_obj = serializer.reset_token
        user = token_obj.user
        user.set_password(serializer.validated_data['password'])
        user.save()
        token_obj.used = True
        token_obj.save()
        return Response({'message': 'Password has been reset successfully.'})


# ========================================
# Email Verification View
# ========================================
class EmailVerifyView(APIView):
    """
    POST /api/v1/auth/verify-email/
    Accepts: { "token": "uuid" }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_obj = serializer.verify_token
        user = token_obj.user
        user.is_verified = True
        user.save(update_fields=['is_verified'])
        token_obj.used = True
        token_obj.save()
        return Response({'message': 'Email verified successfully.'})


class ResendVerificationView(APIView):
    """
    POST /api/v1/auth/resend-verification/
    Accepts: { "email": "user@example.com" }
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]  # Same rate limit as password reset

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If an account with that email exists, a verification link has been sent.'})
        if user.is_verified:
            return Response({'message': 'This email is already verified.'})
        # Invalidate old tokens and create new one
        EmailVerificationToken.objects.filter(user=user, used=False).update(used=True)
        EmailVerificationToken.objects.create(user=user)
        _send_verification_email(user)
        return Response({'message': 'Verification email sent.'})


# ========================================
# Pincode Check View (standalone, no auth needed)
# ========================================
class PincodeCheckView(APIView):
    """
    POST /api/v1/pincode-check/
    Accepts: { "pincode": "110001" }
    Returns serviceability info for the pincode.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PincodeCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.pincode_data)


# ========================================
# Contact Form View
# ========================================
class ContactFormView(APIView):
    """
    POST /api/v1/contact/
    Accepts: { "name", "email", "phone", "subject", "message", "inquiry_type" }
    Sends an email to the support team with the contact form details.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ContactFormThrottle]

    def post(self, request):
        serializer = ContactFormSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        support_email = getattr(settings, 'SUPPORT_EMAIL', settings.DEFAULT_FROM_EMAIL)

        subject = f"[PrintDoot Contact] {data['inquiry_type'].title()}: {data['subject']}"
        body = (
            f"New Contact Form Submission\n"
            f"{'=' * 40}\n\n"
            f"Name: {data['name']}\n"
            f"Email: {data['email']}\n"
            f"Phone: {data.get('phone', 'N/A')}\n"
            f"Inquiry Type: {data['inquiry_type'].replace('_', ' ').title()}\n"
            f"Subject: {data['subject']}\n\n"
            f"Message:\n{data['message']}\n"
        )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[support_email],
                fail_silently=False,
            )
        except Exception:
            pass  # Don't fail the request if email sending fails

        return Response({
            'message': 'Your message has been sent successfully. We will get back to you shortly.'
        }, status=status.HTTP_200_OK)


# ========================================
# Helper Functions for Emails
# ========================================
def _send_password_reset_email(user, token):
    """Send password reset email with token."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password/{token}"
    try:
        send_mail(
            subject='Reset Your Password',
            message=(
                f"Hi {user.first_name or user.username},\n\n"
                f"You requested a password reset. Click the link below to reset your password:\n\n"
                f"{reset_link}\n\n"
                f"This link will expire in 24 hours.\n\n"
                f"If you didn't request this, please ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass  # Don't break the flow if email fails


def _send_verification_email(user):
    """Send email verification link to user."""
    token_obj = user.email_verification_tokens.filter(used=False).order_by('-created_at').first()
    if not token_obj:
        token_obj = EmailVerificationToken.objects.create(user=user)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verify_link = f"{frontend_url}/verify-email/{token_obj.token}"
    try:
        send_mail(
            subject='Verify Your Email',
            message=(
                f"Hi {user.first_name or user.username},\n\n"
                f"Welcome! Please verify your email by clicking the link below:\n\n"
                f"{verify_link}\n\n"
                f"This link will expire in 72 hours."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass

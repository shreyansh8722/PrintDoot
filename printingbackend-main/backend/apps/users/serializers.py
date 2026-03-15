from rest_framework import serializers
from .models import User, Role, Address

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'type', 'is_default',
            'company_name', 'recipient_name', 'phone_number',
            'street', 'apartment_suite', 'city', 'state', 'zip_code', 'country'
        ]
        read_only_fields = ['id', 'user']

    def create(self, validated_data):
        # Auto-assign user from context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'avatar', 'company_name', 'tax_id',
            'role', 'addresses',
            'is_verified', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'is_verified', 'date_joined', 'last_login']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'company_name', 'phone']
    
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
        return user

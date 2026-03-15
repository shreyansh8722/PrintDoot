from rest_framework import serializers
from .models import Category, Subcategory, Product, ProductImage, ProductReview, Banner
from apps.zakeke.models import ZakekeProduct



class ProductMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'primary_image', 'is_featured']

class SubcategorySerializer(serializers.ModelSerializer):
    products = ProductMinimalSerializer(many=True, read_only=True)
    
    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'slug', 'description', 'image', 'category', 'products']

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubcategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'subcategories']



class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image', 'alt_text', 'display_order', 'is_primary', 'created_at']
        read_only_fields = ['created_at']

class ProductReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'user', 'user_email', 'user_name', 'rating', 'title', 'comment', 
                  'is_verified_purchase', 'helpful_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'helpful_count']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() if hasattr(obj.user, 'get_full_name') else obj.user.email


class ProductSerializer(serializers.ModelSerializer):
    subcategory_name = serializers.ReadOnlyField(source='subcategory.name')
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    final_price = serializers.ReadOnlyField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    zakeke_product_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'subcategory', 'subcategory_name', 'name', 'slug', 'sku',
            'description', 'base_price', 'stock_quantity', 
            'discount_type', 'discount_value', 'discount_start_date', 'discount_end_date', 'is_on_sale',
            'final_price', 'primary_image', 'images',
            'reviews', 'average_rating', 'review_count',
            'zakeke_product_id',
            'meta_title', 'meta_description', 'is_active', 'is_featured'
        ]
    
    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews:
            return sum(r.rating for r in reviews) / len(reviews)
        return 0
    
    def get_review_count(self, obj):
        return obj.reviews.count()

    def create(self, validated_data):
        zakeke_id = validated_data.pop('zakeke_product_id', None)
        product = Product.objects.create(**validated_data)
        if zakeke_id:
            ZakekeProduct.objects.create(product=product, zakeke_product_id=zakeke_id)
        return product

    def update(self, instance, validated_data):
        zakeke_id = validated_data.pop('zakeke_product_id', None)
        
        # Standard update logic for the main product fields:
        instance.name = validated_data.get('name', instance.name)
        instance.slug = validated_data.get('slug', instance.slug)
        instance.sku = validated_data.get('sku', instance.sku)
        instance.subcategory = validated_data.get('subcategory', instance.subcategory)
        instance.description = validated_data.get('description', instance.description)
        instance.base_price = validated_data.get('base_price', instance.base_price)
        instance.stock_quantity = validated_data.get('stock_quantity', instance.stock_quantity)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        
        instance.discount_type = validated_data.get('discount_type', instance.discount_type)
        instance.discount_value = validated_data.get('discount_value', instance.discount_value)
        instance.is_on_sale = validated_data.get('is_on_sale', instance.is_on_sale)
        instance.primary_image = validated_data.get('primary_image', instance.primary_image)
        instance.save()
        
        if zakeke_id is not None:
            if zakeke_id == "":
                ZakekeProduct.objects.filter(product=instance).delete()
            else:
                ZakekeProduct.objects.update_or_create(
                    product=instance,
                    defaults={'zakeke_product_id': zakeke_id, 'is_active': True}
                )
        return instance
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if hasattr(instance, 'zakeke_mapping'):
            ret['zakeke_product_id'] = instance.zakeke_mapping.zakeke_product_id
        else:
            ret['zakeke_product_id'] = None
        return ret

class BannerSerializer(serializers.ModelSerializer):
    buttons = serializers.SerializerMethodField()
    footer = serializers.CharField(source='footer_text', read_only=True)
    
    class Meta:
        model = Banner
        fields = ['id', 'title', 'subtitle', 'image', 'placement', 'buttons', 'footer', 
                  'is_active', 'display_order', 'start_date', 'end_date']
    
    def get_buttons(self, obj):
        """Transform buttons_json to match frontend format"""
        return obj.buttons_json if obj.buttons_json else []


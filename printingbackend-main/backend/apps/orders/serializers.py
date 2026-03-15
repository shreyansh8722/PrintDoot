from rest_framework import serializers
from .models import Order, OrderItem, PrintJob, Shipment
from apps.users.serializers import AddressSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'design', 'quantity', 'unit_price', 'total_price', 'product_name', 'frozen_canvas_state', 'print_file_url', 'render_status']
        read_only_fields = ['id', 'unit_price', 'total_price', 'frozen_canvas_state', 'print_file_url', 'render_status']

    def create(self, validated_data):
        # Auto-freeze canvas state from the Design
        design = validated_data.get('design')
        if design:
            validated_data['frozen_canvas_state'] = design.design_json
        
        # Auto-snapshot product details
        product = validated_data.get('product')
        if product:
            validated_data['product_name_snapshot'] = product.name
            validated_data['sku_snapshot'] = product.sku
            validated_data['unit_price'] = product.base_price # Simple price logic for now
            validated_data['total_price'] = product.base_price * validated_data['quantity']
        
        return super().create(validated_data)

class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = ['carrier', 'tracking_number', 'status', 'shipped_at', 'delivered_at']
        read_only_fields = ['shipped_at', 'delivered_at']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True) # Writable nested serializer is complex, keeping simple for MVP
    shipping_address_details = AddressSerializer(source='shipping_address', read_only=True)
    shipment = ShipmentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'total_amount', 'currency', 
            'subtotal', 'tax_total', 'shipping_total', 'discount_total',
            'shipping_address', 'shipping_address_details', 
            'items', 'shipment', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'total_amount', 'subtotal', 'tax_total']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Calculate totals (Simplified)
        subtotal = sum(item['product'].base_price * item['quantity'] for item in items_data)
        validated_data['subtotal'] = subtotal
        validated_data['total_amount'] = subtotal # + tax + shipping later
        
        # Assign User
        validated_data['user'] = self.context['request'].user
        
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            # Re-use logic from OrderItemSerializer could be cleaner, but manual here for nested write
            product = item_data['product']
            design = item_data.get('design')
            quantity = item_data['quantity']
            
            OrderItem.objects.create(
                order=order,
                product=product,
                design=design,
                quantity=quantity,
                unit_price=product.base_price,
                total_price=product.base_price * quantity,
                product_name_snapshot=product.name,
                sku_snapshot=product.sku,
                frozen_canvas_state=design.design_json if design else None
            )
        return order

from rest_framework import serializers
from .models import Item
from .models import Personnel
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class PersonnelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Personnel
        fields = '__all__'
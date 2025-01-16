from rest_framework import serializers
from .models import Item, Personnel, RoomSchedule
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class PersonnelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Personnel
        fields = '__all__'

class RoomScheduleSerializer(serializers.ModelSerializer):
    room_number = serializers.ReadOnlyField(source='room.number')  
    is_occupied = serializers.SerializerMethodField()

    def get_is_occupied(self, obj):
        return obj.room.is_occupied()

    class Meta:
        model = RoomSchedule
        fields = [
            'room_number', 'section', 'date', 'start_time', 
            'end_time', 'class_name', 'professor', 'day_of_week', 'is_occupied'
        ]

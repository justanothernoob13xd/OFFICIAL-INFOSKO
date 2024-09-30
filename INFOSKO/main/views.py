from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response    
from .models import Personnel, Item, Room, RoomSchedule
from .serializers import PersonnelSerializer, ItemSerializer


#API TESTING
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

# API ViewSet for Personnel
class PersonnelViewSet(viewsets.ModelViewSet):
    queryset = Personnel.objects.all()
    serializer_class = PersonnelSerializer

# API endpoint
@api_view(['GET'])
def personnel_list(request):
    personnel = Personnel.objects.all()
    serializer = PersonnelSerializer(personnel, many=True)
    return Response(serializer.data)

# HTML views//BACK FUNCTION
def index(request):
    return render(request, 'main/index.html')

def navigation(request):
    return render(request, 'main/navigation.html')

def secfloor(request):
    return render(request, 'main/secfloor.html')

def thrdfloor(request):
    return render(request, 'main/thrdfloor.html')

def fourthfloor(request):
    return render(request, 'main/fourthfloor.html')

#Functionality for faculties
def faculties(request):
    personnel = Personnel.objects.all()
    context = {
        'personnel': personnel
    }
    return render(request, 'main/faculties.html', context)

def personnel_list(request):
    personnel = Personnel.objects.all()
    personnel_data = [
        {
            'name': person.name,
            'position': person.position,
            'contact': person.contact,
            'location': person.location,
            'image': person.image.url if person.image else ''
        }
        for person in personnel
    ]
    return JsonResponse(personnel_data, safe=False)

#Functionality for Classroom
def classroom(request):
    rooms = Room.objects.all()
    current_day = timezone.localtime().strftime('%A')
    schedules = RoomSchedule.objects.filter(day_of_week=current_day)
    return render(request, 'main/classroom.html', {'rooms': rooms, 'current_day': current_day, 'schedules': schedules})

def get_rooms(request):
    rooms = Room.objects.all()
    room_data = [
        {
            'id': room.id,
            'number': room.number,
            'isOccupied': room.isOccupied,  # Adjust according to your model
            'timestamp': timezone.now().timestamp()
        } for room in rooms
    ]
    return JsonResponse({'rooms': room_data})

def room_modal(request, roomid):
    room = get_object_or_404(Room, id=roomid)
    current_day = timezone.localtime().strftime('%A')
    current_date = timezone.localtime().date()
    schedule = RoomSchedule.objects.filter(room_id=roomid, day_of_week=current_day)

    # Print debug information
    print(f"Room ID: {roomid}")
    print(f"Current Day: {current_day}")
    print(f"Schedules: {schedule}")

    # Get the current time
    current_time = timezone.localtime().time()

    # Check if current time is within any schedule
    is_occupied = any(sch.time_start <= current_time <= sch.time_end for sch in schedule)

    # Update the room's isOccupied field
    room.isOccupied = is_occupied
    room.save()

    return render(request, 'main/room_modal.html', {'room': room, 'schedule': schedule})

        
def check_occupancy(request, roomid):
    room = get_object_or_404(Room, id=roomid)
    current_day = timezone.localtime().strftime('%A')
    current_date = timezone.localtime().date()
    current_time = timezone.localtime().time()

    schedule = RoomSchedule.objects.filter(room_id=room, day_of_week=current_day)
    is_occupied = any(sch.time_start <= current_time <= sch.time_end for sch in schedule)

    room.isOccupied = is_occupied
    room.save()

    return JsonResponse({'id': room.id, 'isOccupied': room.isOccupied})
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import viewsets
from .models import Personnel, Item, Room, RoomSchedule
from .serializers import PersonnelSerializer, ItemSerializer

# API Views
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class PersonnelViewSet(viewsets.ModelViewSet):
    queryset = Personnel.objects.all()
    serializer_class = PersonnelSerializer

# HTML Views
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

def faculties(request):
    personnel = Personnel.objects.all()
    personnel_list = [
        {
            'name': person.name,
            'employment_type': person.employment_type,
            'display_position': person.display_position(),
            'department_position': person.department_position  # Direct access for testing
        }
        for person in personnel
    ]
    context = {
        'personnel_list': personnel_list
    }
    return render(request, 'main/faculties.html', context)

def display_position(self):
    if self.employment_type == 'key-person':  # Direct string match as a test
        return self.department_position
    return ''

def personnel_list(request):
    search_query = request.GET.get('search', '')
    personnel = Personnel.objects.filter(name__icontains=search_query)
    personnel_data = [
        {
            'id': person.id,
            'name': person.name,
            'contact': person.contact,
            'location': person.location,
            'image': person.image.url if person.image else 'https://via.placeholder.com/150',
            'employment_type': person.employment_type,
            'department_position': person.display_position(),
        }
        for person in personnel
    ]
    print("Personnel List (Debug):", personnel_data)  # Corrected line
    return JsonResponse(personnel_data, safe=False)



def personnel_suggestions(request):
    search_term = request.GET.get('search', '')
    if search_term:
        personnels = Personnel.objects.filter(name__icontains=search_term)
        data = [
            {
                "id": personnel.id,
                "name": personnel.name,
                "employment_type": personnel.employment_type,
                "department_position": personnel.department_position if personnel.employment_type == 'key-person' else ''
            }
            for personnel in personnels
        ]
        return JsonResponse(data, safe=False)
    return JsonResponse([], safe=False)

# Classroom Functions
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
            'isOccupied': room.isOccupied,
            'timestamp': timezone.now().timestamp()
        } for room in rooms
    ]
    return JsonResponse({'rooms': room_data})

def room_modal(request, roomid):
    room = get_object_or_404(Room, id=roomid)
    current_day = timezone.localtime().strftime('%A')
    schedule = RoomSchedule.objects.filter(room_id=roomid, day_of_week=current_day)
    current_time = timezone.localtime().time()
    is_occupied = any(sch.time_start <= current_time <= sch.time_end for sch in schedule)
    room.isOccupied = is_occupied
    room.save()
    return render(request, 'main/room_modal.html', {'room': room, 'schedule': schedule})

def check_occupancy(request, roomid):
    room = get_object_or_404(Room, id=roomid)
    current_day = timezone.localtime().strftime('%A')
    current_time = timezone.localtime().time()
    schedule = RoomSchedule.objects.filter(room_id=room, day_of_week=current_day)
    is_occupied = any(sch.time_start <= current_time <= sch.time_end for sch in schedule)
    room.isOccupied = is_occupied
    room.save()
    return JsonResponse({'id': room.id, 'isOccupied': room.isOccupied})

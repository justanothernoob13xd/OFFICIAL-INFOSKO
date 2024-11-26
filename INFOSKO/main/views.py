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

from django.db.models import Case, When, Value, CharField
from django.core.paginator import Paginator
from django.http import JsonResponse
from .models import Personnel


def faculties(request):
    """Fetch all personnel and annotate display_position dynamically."""
    personnel = Personnel.objects.annotate(
        display_position=Case(
            When(employment_type=Personnel.KEY_PERSON, then='department_position'),
            default=Value('', output_field=CharField())
        )
    )
    context = {
        'personnel_list': personnel
    }
    return render(request, 'main/faculties.html', context)


def personnel_list(request):
    """Fetch personnel based on search query and paginate the results."""
    search_query = request.GET.get('search', '')
    personnel = Personnel.objects.filter(name__icontains=search_query).annotate(
        display_position=Case(
            When(employment_type=Personnel.KEY_PERSON, then='department_position'),
            default=Value('', output_field=CharField())
        )
    )
    paginator = Paginator(personnel, 10)  # Paginate 10 items per page
    page_number = request.GET.get('page', 1)
    personnel_page = paginator.get_page(page_number)

    personnel_data = [
        {
            'id': person.id,
            'name': person.name,
            'contact': person.contact,
            'location': person.location,
            'image': person.image.url if person.image else 'https://via.placeholder.com/150',
            'employment_type': person.employment_type,
            'department_position': person.display_position,
        }
        for person in personnel_page
    ]
    return JsonResponse(personnel_data, safe=False)


def personnel_suggestions(request):
    """Return personnel suggestions for a search term."""
    search_term = request.GET.get('search', '')
    if search_term:
        personnel = Personnel.objects.filter(name__icontains=search_term).annotate(
            display_position=Case(
                When(employment_type=Personnel.KEY_PERSON, then='department_position'),
                default=Value('', output_field=CharField())
            )
        )
        data = [
            {
                "id": person.id,
                "name": person.name,
                "employment_type": person.employment_type,
                "department_position": person.display_position
            }
            for person in personnel
        ]
        return JsonResponse(data, safe=False)
    return JsonResponse({'message': 'No search term provided', 'data': []}, safe=False)


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
            'isOccupied': room.occupied,
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
    room.occupied = is_occupied
    room.save()
    return render(request, 'main/room_modal.html', {'room': room, 'schedule': schedule})

def check_occupancy(request, roomid):
    room = get_object_or_404(Room, id=roomid)
    current_day = timezone.localtime().strftime('%A')
    current_time = timezone.localtime().time()
    schedule = RoomSchedule.objects.filter(room_id=room, day_of_week=current_day)
    is_occupied = any(sch.time_start <= current_time <= sch.time_end for sch in schedule)
    room.occupied = is_occupied
    room.save()
    return JsonResponse({'id': room.id, 'isOccupied': room.occupied})

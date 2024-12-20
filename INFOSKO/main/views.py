from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Case, When, Value, CharField
from django.core.paginator import Paginator
from django.core.files.storage import default_storage
from rest_framework import viewsets
import csv
from .models import Personnel, Item, Room, RoomSchedule, Logs
from .serializers import PersonnelSerializer, ItemSerializer
import logging

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


# Personnel Management Views
def add_personnel(request):
    """Add new personnel and log the action."""
    if request.method == 'POST':
        name = request.POST.get('name')
        contact = request.POST.get('contact')
        location = request.POST.get('location')
        employment_type = request.POST.get('employment_type')
        department_position = request.POST.get('department_position')

        new_personnel = Personnel.objects.create(
            name=name,
            contact=contact,
            location=location,
            employment_type=employment_type,
            department_position=department_position
        )
        log_personnel_action('ADD', new_personnel.id, name)
        return JsonResponse({'message': 'Personnel added successfully', 'id': new_personnel.id})

    return JsonResponse({'error': 'Invalid request method'}, status=400)


def delete_personnel(request, personnel_id):
    """Delete personnel and log the action."""
    personnel = get_object_or_404(Personnel, id=personnel_id)
    personnel_name = personnel.name
    personnel.delete()
    log_personnel_action('DELETE', personnel_id, personnel_name)
    return JsonResponse({'message': f'Personnel {personnel_name} deleted successfully'})


def view_logs(request):
    """View logs of personnel actions."""
    logs = Logs.objects.all().order_by('-timestamp')
    log_data = [
        {
            'id': log.id,
            'action_type': log.action,
            'personnel_name': log.personnel_name,
            'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }
        for log in logs
    ]
    return JsonResponse({'logs': log_data})


def archive_logs(request):
    """Archive logs older than a certain date."""
    threshold_date = timezone.now() - timezone.timedelta(days=30)  # Archive logs older than 30 days
    old_logs = Logs.objects.filter(timestamp__lt=threshold_date)
    archived_count = old_logs.count()
    old_logs.delete()
    return JsonResponse({'message': f'{archived_count} logs archived successfully'})

# CSV Upload Functionality
logger = logging.getLogger(__name__)

def upload_csv(request):
    logger.info("View hit: upload_csv")

    if request.method == "POST":
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            messages.error(request, "No file selected! Please upload a file.")
            return render(request, 'admin/personnel_upload_csv.html')

        if not csv_file.name.endswith('.csv'):
            messages.error(request, "Invalid file type! Please upload a .csv file.")
            return render(request, 'admin/personnel_upload_csv.html')

        try:
            decoded_file = csv_file.read().decode('utf-8-sig').splitlines()
            csv_reader = csv.DictReader(decoded_file)

            preview_data = []
            warnings = []

            for idx, row in enumerate(csv_reader, start=1):
                cleaned_row = {k.strip().lower(): v.strip() for k, v in row.items()}
                missing_fields = []

                # Check for missing required fields
                if not cleaned_row.get('name'):
                    missing_fields.append("Name")
                if not cleaned_row.get('contact'):
                    missing_fields.append("Contact")
                if not cleaned_row.get('location'):
                    missing_fields.append("Location")

                # Check for optional fields and issue warnings if empty
                if not cleaned_row.get('employment_type'):
                    missing_fields.append("Employment Type")

                # Department Position is only required for Key-Person
                employment_type = cleaned_row.get('employment_type', '').lower()
                if employment_type == 'key-person' and not cleaned_row.get('department_position'):
                    missing_fields.append("Department Position")

                # Collect warnings for problematic rows
                if missing_fields:
                    warnings.append(
                        {"row": idx, "missing_fields": missing_fields, "data": cleaned_row}
                    )

                preview_data.append(cleaned_row)

            # Store preview data and warnings in session
            request.session['csv_preview_data'] = preview_data
            request.session['csv_warnings'] = warnings

            if warnings:
                messages.warning(request, f"{len(warnings)} rows have potential issues. Please review them.")

            return redirect('confirm_csv_upload')

        except Exception as e:
            logger.error(f"Error processing CSV: {e}")
            messages.error(request, f"Error processing file: {e}")
            return render(request, 'admin/personnel_upload_csv.html')

    return render(request, 'admin/personnel_upload_csv.html')

def confirm_csv_upload(request):
    logger.info("View hit: confirm_csv_upload")
    preview_data = request.session.get('csv_preview_data', [])
    warnings = request.session.get('csv_warnings', [])

    if not preview_data:
        messages.error(request, "No data available for import.")
        return redirect('upload_csv')

    if request.method == "POST":
        action = request.POST.get('action')

        if action == "confirm":
            if warnings:
                logger.warning(f"Proceeding with {len(warnings)} warnings.")

            # Save data to the database
            try:
                for row in preview_data:
                    Personnel.objects.update_or_create(
                        name=row.get('name'),
                        defaults={
                            'contact': row.get('contact', 'Default Contact'),
                            'location': row.get('location', 'Default Location'),
                            'employment_type': row.get('employment_type', 'Unknown'),
                            'department_position': row.get('department_position', 'Unspecified'),
                            'image': row.get('image', '')
                        }
                    )
                messages.success(request, "All personnel data imported successfully!")
                del request.session['csv_preview_data']
                del request.session['csv_warnings']
                return redirect('/admin/main/personnel/')
            except Exception as e:
                logger.error(f"Error saving data: {e}")
                messages.error(request, f"An error occurred while saving data: {e}")
                return redirect('confirm_csv_upload')

        elif action == "cancel":
            del request.session['csv_preview_data']
            del request.session['csv_warnings']
            messages.info(request, "CSV upload canceled.")
            return redirect('/admin/main/personnel/')

    return render(request, 'admin/confirm_csv_upload.html', {
        'preview_data': preview_data,
        'warnings': warnings
    })


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

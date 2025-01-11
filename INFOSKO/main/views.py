from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.utils.timezone import localtime
from django.db.models import Case, When, Value, CharField, Q, IntegerField
from django.core.files.storage import default_storage
from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from .pagination import PersonnelPagination
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

class PersonnelListView(ListAPIView):
    queryset = Personnel.objects.all()
    serializer_class = PersonnelSerializer
    pagination_class = PersonnelPagination

logger = logging.getLogger(__name__)

# Classroom management view
def classroom(request):
    current_day = localtime().strftime('%A')
    return render(request, 'main/classroom.html', {'current_day': current_day})


# API to get all rooms and their statuses
def get_rooms(request):
    try:
        rooms = Room.objects.all()
        room_data = [
            {
                'id': room.id,
                'name': room.number,  # Ensure 'name' is consistent with the frontend
            }
            for room in rooms
        ]
        return JsonResponse({'rooms': room_data}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Error fetching rooms: {str(e)}'}, status=500)


# API to get room schedule
def room_schedule_api(request, room_id):
    try:
        logger.info(f"Fetching schedule for room ID: {room_id}")
        room = get_object_or_404(Room, id=room_id)
        current_date = localtime().date()
        logger.info(f"Current date: {current_date}")

        # Fetch schedules for today
        schedules = RoomSchedule.objects.filter(room=room, date=current_date).order_by('start_time')
        logger.info(f"Schedules fetched: {schedules}")

        regular_schedules = []
        temporary_schedules = []

        for schedule in schedules:
            schedule_data = {
                'class_name': schedule.subject_name,
                'section': schedule.section_name,
                'professor': schedule.professor_name,
                'start_time': schedule.start_time.strftime('%I:%M %p'),
                'end_time': schedule.end_time.strftime('%I:%M %p'),
            }
            if schedule.schedule_type == 'regular':
                regular_schedules.append(schedule_data)
            elif schedule.schedule_type == 'temporary':
                temporary_schedules.append(schedule_data)

        response_data = {
            'room_name': room.number,
            'regularSchedules': regular_schedules,
            'temporarySchedules': temporary_schedules,
        }

        return JsonResponse(response_data, status=200)
    except Exception as e:
        logger.error(f"Error fetching room schedule: {str(e)}")
        return JsonResponse({'error': f"Error fetching schedule: {str(e)}"}, status=500)


# Function to clean up expired temporary schedules
def cleanup_expired_temporary_schedules():
    try:
        now_time = localtime().time()
        now_date = localtime().date()
        expired_schedules = RoomSchedule.objects.filter(
            schedule_type="temporary",
            end_time__lt=now_time,
            date__lt=now_date
        )
        deleted_count, _ = expired_schedules.delete()

        logger.info(f"Cleaned up {deleted_count} expired temporary schedules.")
    except Exception as e:
        logger.exception(f"Error while cleaning up expired temporary schedules: {e}")

#personnel/faculties
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
    search_query = request.GET.get('search', '').strip()
    offset = int(request.GET.get('offset', 0))
    limit = int(request.GET.get('limit', 20))

    print(f"Offset: {offset}, Limit: {limit}, Search Query: '{search_query}'")  # Debugging info

    # Filter personnel
    personnel = Personnel.objects.filter(
        Q(name__icontains=search_query) | Q(department_position__icontains=search_query)
    ).annotate(
        category_order=Case(
            When(employment_type='key-person', then=Value(0)),
            When(employment_type='full-time', then=Value(1)),
            When(employment_type='part-time', then=Value(2)),
            default=Value(3),
            output_field=IntegerField()
        )
    ).order_by('category_order', 'name')

    total_personnel = personnel.count()
    print(f"Total Personnel Count: {total_personnel}")  # Debug total count

    # Paginate personnel
    paginated_personnel = personnel[offset:offset + limit]
    print(f"Paginated Personnel Count: {len(paginated_personnel)}")  # Debug paginated count

    # Prepare JSON response
    personnel_data = [
        {
            'id': person.id,
            'name': person.name,
            'department_position': person.department_position,
            'employment_type': person.employment_type,
            'image': person.image.url if person.image else '/media/defaultpic.jpg',
        }
        for person in paginated_personnel
    ]

    return JsonResponse({
        'total_count': total_personnel,
        'personnel_data': personnel_data
    }, safe=False)


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


def add_personnel(request):
    """Add new personnel and log the action."""
    try:
        # Extract fields from POST request
        name = request.POST.get('name')
        contact = request.POST.get('contact')
        location = request.POST.get('location')
        employment_type = request.POST.get('employment_type')
        department_position = request.POST.get('department_position')

        # Validate required fields
        if not name or not employment_type or not department_position:
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        # Create new personnel
        new_personnel = Personnel.objects.create(
            name=name,
            contact=contact,
            location=location,
            employment_type=employment_type,
            department_position=department_position
        )

        # Log the action
        log_personnel_action('ADD', new_personnel.id, name)

        return JsonResponse({
            'message': 'Personnel added successfully',
            'id': new_personnel.id
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def delete_personnel(request, personnel_id):
    """Delete personnel and log the action."""
    try:
        # Retrieve personnel instance
        personnel = get_object_or_404(Personnel, id=personnel_id)

        # Save personnel name before deletion
        personnel_name = personnel.name

        # Log the action before deleting the object
        log_personnel_action('DELETE', personnel_id, personnel_name)

        # Delete personnel record
        personnel.delete()

        return JsonResponse({
            'message': f'Personnel {personnel_name} deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

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
                            'image': row.get('image') or None  # Use None to trigger default value
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

## HTML Views and Floorplan/Navigation
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

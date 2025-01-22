from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now
from main.models import Room

@api_view(['POST'])
def motion_detected(request):
    """ API endpoint to receive motion detection alerts from Raspberry Pi """
    status_value = request.data.get('status')
    room_id = 125  # Hardcoded room ID

    if not room_id or not status_value:
        return Response({"error": "Missing room_id or status"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Fetch the room by ID
        room = Room.objects.get(id=room_id)
        if status_value == "motion_detected":
            room.occupied = True
            room.last_motion = now()  # Update last motion timestamp
            room.save()
            print(f"Motion detected for Room {room.number}")
            return Response({"message": f"Motion detected for Room {room.number}"}, status=status.HTTP_200_OK)
        elif status_value == "no_motion":
            room.occupied = False  # Reset room to unoccupied
            room.save()
            print(f"No motion signal received for Room {room.number}")
            return Response({"message": f"No motion for Room {room.number}"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid status value"}, status=status.HTTP_400_BAD_REQUEST)
    except Room.DoesNotExist:
        return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
 
@api_view(['POST'])
def motion_detected(request):
    """ API endpoint to receive motion detection alerts from Raspberry Pi """
    if request.data.get('status') == "motion_detected":
        print("Motion detected signal received!")  # You can replace this with database logging or other actions
        return Response({"message": "Motion detected received"}, status=status.HTTP_200_OK)
    return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)
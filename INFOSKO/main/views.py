from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Personnel
from .serializers import PersonnelSerializer
from django.http import JsonResponse

# API ViewSet for Personnel
class PersonnelViewSet(viewsets.ModelViewSet):
    queryset = Personnel.objects.all()
    serializer_class = PersonnelSerializer

# API endpoint for Personnel list
@api_view(['GET'])
def personnel_list(request):
    personnel = Personnel.objects.all()
    serializer = PersonnelSerializer(personnel, many=True)
    return Response(serializer.data)

# HTML views
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

def designated(request):
    return render(request, 'main/designated.html')

def parttime(request):
    return render(request, 'main/parttime.html')

def classroom(request):
    return render(request, 'main/classroom.html')

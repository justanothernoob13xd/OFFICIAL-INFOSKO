from django.shortcuts import render
from rest_framework import viewsets
from .models import Item
from .serializers import ItemSerializer

#API TESTING#
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

#BACK FUNCTION#
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
    return render(request, 'main/faculties.html')

def designated(request):
    return render(request, 'main/designated.html')

def parttime(request):
    return render(request, 'main/parttime.html')

def classroom(request):
    return render(request, 'main/classroom.html')
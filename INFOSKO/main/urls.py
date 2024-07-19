from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonnelViewSet, index, faculties, navigation, secfloor, thrdfloor, fourthfloor, personnel_list, classroom, get_rooms, room_modal, check_occupancy


router = DefaultRouter()
router.register(r'personnel', PersonnelViewSet)

urlpatterns = [
    path('', index, name='index'),
    path('faculties/', faculties, name='faculties'),
    path('navigation/', navigation, name='navigation'),
    path('secfloor/', secfloor, name='secfloor'),
    path('thrdfloor/', thrdfloor, name='thrdfloor'),
    path('fourthfloor/', fourthfloor, name='fourthfloor'),
    path('api/', include(router.urls)),
    path('personnel/', personnel_list, name='personnel'),  # Ensure this path is correct
    path('classroom/', classroom, name='classroom'),
    path('get_rooms/', get_rooms, name='get_rooms'),
    path('classroom/<int:roomid>/', room_modal, name='room_modal'),
    path('check_occupancy/<int:roomid>/', check_occupancy, name='check_occupancy'),
]

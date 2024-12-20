from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views
from rest_framework.routers import DefaultRouter
from .views import PersonnelViewSet, index, faculties, navigation, secfloor, thrdfloor, fourthfloor, personnel_list, personnel_suggestions, classroom, get_rooms, room_modal, check_occupancy


router = DefaultRouter()
router.register(r'personnel', PersonnelViewSet)

urlpatterns = [
    path('', index, name='index'),
    path('faculties/', faculties, name='faculties'),
    path("upload_csv/", views.upload_csv, name="upload_csv"),
    path("confirm_csv_upload/", views.confirm_csv_upload, name="confirm_csv_upload"),
    path('navigation/', navigation, name='navigation'),
    path('secfloor/', secfloor, name='secfloor'),
    path('thrdfloor/', thrdfloor, name='thrdfloor'),
    path('fourthfloor/', fourthfloor, name='fourthfloor'),
    path('api/', include(router.urls)),
    path('api/personnel-list/', personnel_list, name='personnel-list'),
    path('api/personnel-suggestions/', personnel_suggestions, name='personnel-suggestions'),
    path('classroom/', classroom, name='classroom'),
    path('get_rooms/', get_rooms, name='get_rooms'),
    path('classroom/<int:roomid>/', room_modal, name='room_modal'),
    path('check_occupancy/<int:roomid>/', check_occupancy, name='check_occupancy'),
]

if settings.DEBUG:  # Only serve media files in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
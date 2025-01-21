from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views 
from rest_framework.routers import DefaultRouter
from .views import PersonnelViewSet, index, faculties, navigation, secfloor, thrdfloor, fourthfloor, personnel_list, personnel_suggestions, upload_csv_classroom
router = DefaultRouter()
router.register(r'personnel', PersonnelViewSet,)

urlpatterns = [
    path('', index, name='index'),
    path('faculties/', faculties, name='faculties'),
    path("upload_csv/", views.upload_csv, name="upload_csv"),
    path("confirm_csv_upload/", views.confirm_csv_upload, name="confirm_csv_upload"),
    path('navigation/', navigation, name='navigation'),
    path('secfloor/', secfloor, name='secfloor'),
    path('thrdfloor/', thrdfloor, name='thrdfloor'),
    path('fourthfloor/', fourthfloor, name='fourthfloor'),
    path('api/', include('motion.urls')),  # Now the endpoint will be accessible at /api/motion/
    path('api/', include(router.urls)),
    path('api/personnel-list/', personnel_list, name='personnel-list'),
    path('api/personnel-suggestions/', personnel_suggestions, name='personnel-suggestions'),
    path('classroom/', views.classroom, name='classroom'),
    path('api/room-schedule/<int:room_id>/', views.room_schedule_api, name='room_schedule_api'),
    path('api/get-rooms/', views.get_rooms, name='get_rooms'),
    path('upload-classroom-csv/', views.upload_csv_classroom, name='upload_classroom_csv'),
    path('confirm-csv-upload-classroom/', views.confirm_csv_upload_classroom, name='confirm_csv_upload_classroom'),

]

if settings.DEBUG:  # Only serve media files in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
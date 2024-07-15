from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonnelViewSet, index, faculties, navigation, secfloor, thrdfloor, fourthfloor, designated, parttime, classroom, personnel_list

router = DefaultRouter()
router.register(r'personnel', PersonnelViewSet)

urlpatterns = [
    path('', index, name='index'),
    path('faculties/', faculties, name='faculties'),
    path('navigation/', navigation, name='navigation'),
    path('secfloor/', secfloor, name='secfloor'),
    path('thrdfloor/', thrdfloor, name='thrdfloor'),
    path('fourthfloor/', fourthfloor, name='fourthfloor'),
    path('designated/', designated, name='designated'),
    path('parttime/', parttime, name='parttime'),
    path('classroom/', classroom, name='classroom'),
    path('api/', include(router.urls)),
    path('personnel/', personnel_list, name='personnel'),  # Ensure this path is correct
]

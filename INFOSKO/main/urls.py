from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('navigation/', views.navigation, name='navigation'),
    path('secfloor/', views.secfloor, name='secfloor'),
    path('thrdfloor/', views.thrdfloor, name='thrdfloor'),
    path('fourthfloor/', views.fourthfloor, name='fourthfloor'),
    path('faculties/', views.faculties, name='faculties'),
    path('designated/', views.designated, name='designated'),
    path('parttime/', views.parttime, name='parttime'),
    path('classroom/', views.classroom, name='classroom'),

]

from django.urls import path
from .views import motion_detected
 
urlpatterns = [
    path('motion/', motion_detected, name='motion_detected'),
]
 
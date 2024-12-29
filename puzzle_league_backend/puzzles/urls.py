from django.urls import include, path, re_path
from rest_framework import routers

from . import views

router = routers.SimpleRouter()
router.register(r'competitions',views.CompetitionViewSet,           basename='competition')
router.register(r'categories',  views.CategoryViewSet,              basename='category')
router.register(r'participants',views.ParticipantViewSet,           basename='participant')
router.register(r'locations',   views.LocationViewSet,              basename='locations')

urlpatterns = [
    path('', include((router.urls, 'puzzles'))),
]
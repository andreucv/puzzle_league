from django.urls import include, path, re_path
from rest_framework import routers

from . import views

router = routers.SimpleRouter()
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('api/', include((router.urls, 'users'))),
]
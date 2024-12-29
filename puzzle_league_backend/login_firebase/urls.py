from django.urls import include, path
from rest_framework import routers
from . import views
from knox import views as knox_views

router = routers.DefaultRouter()
router.register('login',      views.FirebaseLoginViewset,    basename='login')
# router.register('logout',     knox_views.LogoutView.as_view(),    basename='logout')
# router.register('logoutall',  knox_views.LogoutAllView.as_view(), basename='logoutall')

urlpatterns = [
    #path('login/', views.FirebaseLoginViewset, name='login'),
    path('', include(router.urls)),
]
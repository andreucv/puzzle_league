from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

# Register your models here.
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'token']

admin.site.register(CustomUser, CustomUserAdmin)
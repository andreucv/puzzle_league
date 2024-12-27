from django.contrib import admin

# Register your models here.
from .models import *

admin.site.register(Brand)
admin.site.register(Category)
admin.site.register(Competition)
admin.site.register(Party)
admin.site.register(Puzzle)
admin.site.register(Participant)
admin.site.register(Register)
admin.site.register(Location)

from rest_framework import serializers 
from .models import *

class FirebaseLoginSerializer(serializers.ModelSerializer):
    token = serializers.CharField(max_length=1000, required=True)

    def to_representation(self, instance):
        return super().to_representation(instance)
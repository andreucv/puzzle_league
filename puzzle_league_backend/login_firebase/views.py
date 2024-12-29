from rest_framework import viewsets, status, permissions
from django.contrib.auth import authenticate
from rest_framework.response import Response
from knox.models import AuthToken
from .serializers import FirebaseLoginSerializer

class FirebaseLoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    def create(self, request):
        token = request.data['token']
        if not token:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, token=token)

        if user:
            _, token = AuthToken.objects.create(user)
            return Response({'token': token}, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

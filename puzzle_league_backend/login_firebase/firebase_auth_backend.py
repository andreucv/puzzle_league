from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User

from firebase_admin import auth

class FirebaseAuthBackend(BaseBackend):
    def authenticate(self, request, token=None):
        if not token:
            return None

        try:
            decoded_token = auth.verify_id_token(token)
            email = decoded_token["email"]
        except:
            return None
            
        try:
            user = User.objects.get(email=email)
            return user
        except User.DoesNotExist:
            # if user is authenticated correctly and the user does not exist in the database
            # then create a new user with the uid and email from the decoded token
            user = User.objects.create(username=decoded_token["email"], email=decoded_token["email"])
            return user
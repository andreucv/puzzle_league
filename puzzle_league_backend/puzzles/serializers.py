from rest_framework import serializers

from .models import Participant, Party, Register, Competition, Category, Location
from django.contrib.auth.models import User, Group
from taggit.serializers import (TagListSerializerField, TaggitSerializer)

class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = ['id', 'name', 'start_date', 'end_date', 'location', 'image', 'created_by']

class CategorySerializer(serializers.HyperlinkedModelSerializer):
    #competition = serializers.ChoiceField(choices=Competition.objects.all())
    competition = serializers.PrimaryKeyRelatedField(queryset=Competition.objects.all())
    #puzzle = serializers.PrimaryKeyRelatedField(queryset=Puzzle.objects.all())

    class Meta:
        model = Category
        fields = [
                  'id',
                  'category_type',
                  'competition',
                  'date', 'start_time', 'end_time',
                  'participation_fee',
                  'total_places',
                  'parties_registered',
                  'public_puzzle',
                  #'puzzle',
                  'registers',
                ]

class CategoryNameSerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format="%H:%M")
    end_time   = serializers.TimeField(format="%H:%M")

    class Meta:
        model = Category
        fields = ['category_type', 'date', 'start_time', 'end_time', 'participation_fee']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'full_address', 'city', 'country']

class CompetitionCategorySerializer(serializers.ModelSerializer):
    categories = CategoryNameSerializer(many=True, read_only=True)
    location = LocationSerializer()

    class Meta:
        model = Competition
        fields = ['id', 'name', 'start_date', 'end_date', 'location', 'image', 'created_by', 'categories']

class GroupSerializer(serializers.ModelSerializer):    
    class Meta:
        model = Group
        fields = ['name']

class UserSerializer(serializers.ModelSerializer):    
    groups = GroupSerializer(many=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'groups']

class ParticipantSerializer(serializers.ModelSerializer):   
    user = UserSerializer()
    
    class Meta:
        model = Participant
        fields = ['id', 'user', 'country', 'public_country', 'public_ranking', 'public_points', 'public_puzzles', 'public_awards']

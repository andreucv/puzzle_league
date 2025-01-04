from django.http import JsonResponse
from rest_framework import viewsets, mixins
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
import datetime
from rest_framework.decorators import permission_classes

from .models import Competition,Participant,Location,Category
from .serializers import *

# Create your views here.
@permission_classes((AllowAny, ))
class CompetitionViewSet(viewsets.ModelViewSet, mixins.CreateModelMixin):
    serializer_class = CompetitionSerializer
    queryset = Competition.objects.all()

    @action(detail=False, methods=['get'])
    def get_upcoming_competitions(self, request):
        queryset = Competition.objects.filter(start_date__gt=datetime.date.today()).order_by('start_date')[:5]
        return JsonResponse(CompetitionSerializer(queryset, many=True).data, safe=False)

    @action(detail=False, methods=['get'])
    def get_user_competitions(self, request):
        user_id = self.request.query_params.get('user_id')
        queryset = Competition.objects.filter(created_by=user_id).order_by('start_date').reverse()
        return JsonResponse(CompetitionSerializer(queryset, many=True).data, safe=False)

    @action(detail=False, methods=['get'])
    def get_competitions_and_categories_upcoming(self, request):
        queryset = Competition.objects.filter(start_date__gt=datetime.date.today()).order_by('start_date')
        serialized_data = CompetitionCategorySerializer(queryset, many=True).data
        return JsonResponse(serialized_data, safe=False)

    @action(detail=False, methods=['get'])
    def get_competitions_and_categories_past(self, request):
        queryset = Competition.objects.filter(start_date__lt=datetime.date.today()).order_by('start_date').reverse()
        serialized_data = CompetitionCategorySerializer(queryset, many=True).data
        return JsonResponse(serialized_data, safe=False)

    @action(detail=True, methods=['get'])
    def get_categories(self, request, pk=None):
        competition = Competition.objects.get(pk=pk)
        serialized_data = CompetitionCategorySerializer(competition).data
        return JsonResponse(serialized_data, safe=False)

@permission_classes((AllowAny, ))
class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = LocationSerializer
    queryset = Location.objects.all()

@permission_classes((AllowAny, ))
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()

    class Meta:
        model = Category
        fields = ('category_type', 'competition', 'start_time', 'timeout')

@permission_classes((AllowAny, ))
class ParticipantViewSet(viewsets.ModelViewSet):
    serializer_class = ParticipantSerializer
    queryset = Participant.objects.all()

    @action(detail=False, methods=['get'])
    def get_participant_from_user(self, request):
        queryset = Participant.objects.all()
        user_id = self.request.query_params.get('user_id')
        if user_id is not None:
            queryset = queryset.filter(user=user_id)
        return JsonResponse(ParticipantSerializer(queryset, many=True).data, safe=False)
    
    @action(detail=False, methods=['get'])
    @permission_classes((IsAuthenticated, ))
    def get_participant(self, request):
        print("get participant request", str(request), flush=True)
        print(self.queryset)
        return JsonResponse(ParticipantSerializer(Participant.objects.filter(user=request.user), many=False).data, safe=False)
    
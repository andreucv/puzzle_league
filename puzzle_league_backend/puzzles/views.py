from .models import Competition,Brand,Participant

from rest_framework import viewsets, mixins
from .serializers import *

from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.contrib.auth.decorators import login_required, permission_required

from django.core.exceptions import ObjectDoesNotExist

import datetime

from django.contrib.auth import authenticate

from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import JsonResponse

# Create ViewSets here
from rest_framework.decorators import action
# Create your views here.
@permission_classes((AllowAny, ))
class BrandViewSet(viewsets.ModelViewSet):
    serializer_class = BrandSerializer
    queryset = Brand.objects.all()

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

    # @action(detail=True, methods=['get'])
    # def get_last_puzzles(self, request, pk=None):
    #     participant = Participant.objects.get(pk=pk)
    #     last_puzzles = participant.puzzleitem_collection.order_by('-date_added_to_col')[:5]
    #     serialized_data = PuzzleItemSerializer(last_puzzles, many=True).data
    #     return JsonResponse(serialized_data, safe=False)

    @action(detail=True, methods=['get'])
    def get_all_puzzles_from_puzzleitems(self, request, pk=None):
        participant = Participant.objects.get(pk=pk)
        puzzleItems_collection = participant.puzzleitem_collection.all()
        puzzles = []
        for puzzleItem in puzzleItems_collection:
            puzzles.append(puzzleItem.puzzle)
        serialized_data = PuzzleSerializer(puzzles, many=True).data
        return JsonResponse(serialized_data, safe=False)


    # @action(detail=True, methods=['post'])
    # def add_puzzle_to_collection(self, request, pk=None):
    #     participant = Participant.objects.get(pk=pk)
    #     puzzle_id = request.data.get('puzzle_id')
    #     print("Request: ", request.data, flush=True)
    #     print("Puzzle id: ", puzzle_id, flush=True)
    #     puzzle = Puzzle.objects.get(pk=puzzle_id)
    #     for puzzle_item in participant.puzzleitem_collection.all():
    #         if puzzle_item.puzzle == puzzle:
    #             print("Puzzle already in collection", flush=True)
    #             return Response({'type':'error', 'message': 'already_in_collection'})
    #     puzzle_item = PuzzleItem(puzzle=puzzle, status='C', date_added_to_col=datetime.datetime.now())
    #     puzzle_item.save()
    #     print("PuzzleItem created is: ", puzzle_item, flush=True)

    #     participant.puzzleitem_collection.add(puzzle_item)
    #     print("Participant collection after adding: ", participant.puzzleitem_collection.all(), flush=True)
    #     return Response({'type':'ok', 'message': 'success'})

@permission_classes((AllowAny,))
class PuzzleViewSet(viewsets.ModelViewSet):
    serializer_class = PuzzleSerializer
    queryset = Puzzle.objects.all()

    @action(detail=True, methods=['get'])
    def filter_puzzles(self, request, pk=None):
        puzzles = Puzzle.objects.get(pk=pk)
        top_puzzles = puzzles.collection.all()[:5]
        serialized_data = PuzzleSerializer(top_puzzles, many=True).data
        return JsonResponse(serialized_data, safe=False)


    @action(detail=False, methods=['get'])
    def autocomplete_npieces(self, request):
        npieces_values = list(Puzzle.objects.values_list('npieces', flat=True).distinct())
        return JsonResponse({'npieces_values':npieces_values}, safe=False)

    @action(detail=False, methods=['get'])
    def autocomplete_tags(self, request):
        tags_values = sorted(list(Puzzle.objects.values_list('tags__name', flat=True).distinct())[1:])
        return JsonResponse({'tags_values':tags_values}, safe=False)

    @action(detail=False, methods=['get'])
    def autocomplete_brands(self, request):
        brands_values = sorted(list(Puzzle.objects.values_list('brand__name', flat=True).distinct()))
        return JsonResponse({'brands_values':brands_values}, safe=False)

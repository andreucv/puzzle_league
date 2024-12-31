from django.db import models
from django.contrib.auth.models import User
from django_countries.fields import CountryField

# Register your models here.
class Participant(models.Model):
    country     = models.CharField(max_length=30)
    pending_user= models.BooleanField(default=True)
    user        = models.OneToOneField(User, on_delete=models.CASCADE)
    #puzzleitem_collection = models.ManyToManyField(PuzzleItem, blank=True)

    def __str__(self):
        # e.g. : Peter Smith - Berlin (Germany)
        return str(self.user.first_name + self.user.last_name + ' - ' + str(self.country))

class Register(models.Model):
    time              = models.TimeField()
    date              = models.DateField()
    completed_npieces = models.IntegerField()
    participants      = models.ManyToManyField(Participant)
    group_name        = models.CharField(max_length=30, blank=True)
    #puzzle            = models.ForeignKey(Puzzle, on_delete=models.DO_NOTHING)

    def __str__(self):
        return "Register: Finished Puzzle: Participants : " + str([participant for participant in self.participants.all()]) + 'Completed: ' + str(self.completed_npieces) + ' pieces in ' + str(self.time) + ' - ' + str(self.date)

class Location(models.Model):
    full_address    = models.CharField(max_length=200)
    city            = models.CharField(max_length=50)
    country         = CountryField()

    def __str__(self):
        return self.city


class Party(models.Model):
    group_name  = models.CharField(max_length=30, blank=True)
    participants= models.ManyToManyField(Participant)

    def __str__(self):
        if len(self.participants.all()) == 1:
            return "Individual " + self.participants.all()[0].user.first_name + self.participants.all()[0].user.last_name
        elif len(self.participants.all()) == 2:
            return "Pareja " + self.participants.all()[0].firstname + self.participants.all()[0].lastname + self.participants.all()[1].firstname + self.participants.all()[1].lastname
        else:
            return "Equipo " + self.group_name

class Competition(models.Model):
    name        = models.CharField(max_length=100)
    start_date  = models.DateField(blank=True)
    end_date    = models.DateField(blank=True)
    location    = models.ForeignKey(Location, on_delete=models.DO_NOTHING, blank=True)
    image       = models.CharField(max_length=300)
    created_by  = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    def __str__(self):
        return self.name + ' ' + str(self.start_date)

    # def today_competitions(self):
    #     from datetime import datetime, timedelta, time

    #     today = datetime.now().date()
    #     tomorrow = today + timedelta(1)
    #     today_start = datetime.combine(today, time())
    #     today_end = datetime.combine(tomorrow, time())
    #     return self.filter(start_date__lte=today_end, end_date__gte=today_start)

class Category(models.Model):
    class CategoryType(models.TextChoices):
        INDIVIDUAL  = 'Individual'
        PAREJAS     = 'Parejas'
        GRUPOS      = 'Grupos'
        INFANTIL    = 'Infantil'

    # Organization of the category competition
    category_type   = models.CharField(max_length=20)
    competition     = models.ForeignKey(Competition, on_delete=models.CASCADE, blank=False, related_name='categories')
    date            = models.DateField(blank=True)
    start_time      = models.TimeField(blank=True)
    end_time        = models.TimeField(blank=True)
    participation_fee   = models.DecimalField(max_digits=6, decimal_places=0, blank=True)

    # During the category competition
    total_places        = models.IntegerField(blank=True)
    parties_registered  = models.ManyToManyField(Party, blank=True)
    public_puzzle       = models.BooleanField(default=False)
    #puzzle              = models.ForeignKey(Puzzle, on_delete=models.DO_NOTHING, blank=True)

    # After the category competition
    registers           = models.ManyToManyField(Register, blank=True)

    def __str__(self):
        return str(self.competition) + ' ' + str(self.category_type)

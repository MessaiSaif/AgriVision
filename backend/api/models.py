from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('AGRICULTEUR', 'Agriculteur'),
        ('ADMINISTRATEUR', 'Administrateur'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='AGRICULTEUR')

    def __str__(self):
        return self.username

class Culture(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cultures')
    name = models.CharField(max_length=100)
    plant_type = models.CharField(max_length=50) # ex: Tomate
    planting_date = models.DateField()
    location = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.plant_type})"

class Disease(models.Model):
    name = models.CharField(max_length=100)
    plant = models.CharField(max_length=50) # ex: Tomate
    description = models.TextField()
    symptoms = models.TextField()
    advice = models.TextField()

    def __str__(self):
        return self.name

class Analysis(models.Model):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name='analyses')
    disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(upload_to='analysis_images/')
    date = models.DateTimeField(auto_now_add=True)
    confidence = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Analysis {self.id} for {self.culture.name}"

class ChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
    message = models.TextField()
    response = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat with {self.user.username} at {self.date}"

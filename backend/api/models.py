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

class Task(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    culture = models.ForeignKey(Culture, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class InventoryItem(models.Model):
    CATEGORY_CHOICES = (
        ('FERTILIZER', 'Fertilizer'),
        ('PESTICIDE', 'Pesticide'),
        ('SEED', 'Seed'),
        ('EQUIPMENT', 'Equipment'),
        ('OTHER', 'Other'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory')
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    quantity = models.FloatField(default=0.0)
    unit = models.CharField(max_length=20) # ex: 'L', 'Kg', 'Units'
    
    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

class FinanceRecord(models.Model):
    TYPE_CHOICES = (
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='finances')
    record_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.record_type} - {self.amount} - {self.date}"

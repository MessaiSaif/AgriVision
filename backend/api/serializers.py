from rest_framework import serializers
from .models import User, Culture, Disease, Analysis, ChatHistory, Task, InventoryItem, FinanceRecord

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class CultureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Culture
        fields = '__all__'
        read_only_fields = ['user']

class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = '__all__'

class AnalysisSerializer(serializers.ModelSerializer):
    disease_info = DiseaseSerializer(source='disease', read_only=True)
    culture_info = CultureSerializer(source='culture', read_only=True)
    
    class Meta:
        model = Analysis
        fields = '__all__'
        read_only_fields = ['confidence', 'disease', 'date']

class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = '__all__'
        read_only_fields = ['user', 'response', 'date']

class TaskSerializer(serializers.ModelSerializer):
    culture_info = CultureSerializer(source='culture', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['user']

class FinanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceRecord
        fields = '__all__'
        read_only_fields = ['user']

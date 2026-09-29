from rest_framework import serializers
from .models import User, Culture, Disease, Analysis, ChatHistory

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

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
    
    class Meta:
        model = Analysis
        fields = '__all__'
        read_only_fields = ['confidence', 'disease', 'date']

class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = '__all__'
        read_only_fields = ['user', 'response', 'date']

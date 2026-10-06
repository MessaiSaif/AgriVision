from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, CultureViewSet, DiseaseViewSet, 
    AnalysisViewSet, ChatbotView, TaskViewSet, 
    InventoryItemViewSet, FinanceRecordViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'cultures', CultureViewSet, basename='culture')
router.register(r'diseases', DiseaseViewSet)
router.register(r'analyses', AnalysisViewSet, basename='analysis')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'inventory', InventoryItemViewSet, basename='inventory')
router.register(r'finances', FinanceRecordViewSet, basename='finance')

urlpatterns = [
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('', include(router.urls)),
]

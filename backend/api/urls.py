from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CultureViewSet, DiseaseViewSet, AnalysisViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'cultures', CultureViewSet, basename='culture')
router.register(r'diseases', DiseaseViewSet)
router.register(r'analyses', AnalysisViewSet, basename='analysis')

urlpatterns = [
    path('', include(router.urls)),
]

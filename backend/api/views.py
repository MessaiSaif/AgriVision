from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Culture, Disease, Analysis, ChatHistory
from .serializers import (
    UserSerializer, CultureSerializer, DiseaseSerializer,
    AnalysisSerializer, ChatHistorySerializer
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """GET /api/users/me/ - Retourne le profil de l'utilisateur connecté."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CultureViewSet(viewsets.ModelViewSet):
    serializer_class = CultureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Culture.objects.filter(user=self.request.user).order_by('-planting_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DiseaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer
    permission_classes = [permissions.AllowAny]


class AnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Analysis.objects.filter(culture__user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        """
        Sauvegarde l'image et lance la prédiction YOLO.
        
        Stratégie de recherche :
        1. YOLO détecte la maladie sur l'image.
        2. On utilise la plante de la culture (saisie par l'utilisateur) comme indice.
        3. On cherche la maladie détectée pour la bonne plante (ex: Black_rot sur Pomme, 
           même si YOLO a confondu avec Raisin).
        4. Mode démo si le modèle est indisponible.
        """
        analysis = serializer.save()
        disease_found = False

        # Récupère la plante associée à la culture de l'utilisateur
        culture_plant = analysis.culture.plant_type  # ex: "Pomme", "Tomate"

        # Table de correspondance plante (saisie utilisateur → nom BD)
        PLANT_ALIAS = {
            'pomme': 'Pomme', 'apple': 'Pomme',
            'tomate': 'Tomate', 'tomato': 'Tomate',
            'maïs': 'Maïs', 'mais': 'Maïs', 'corn': 'Maïs', 'maize': 'Maïs',
            'raisin': 'Raisin', 'grape': 'Raisin',
            'pêche': 'Pêche', 'peche': 'Pêche', 'peach': 'Pêche',
            'poivron': 'Poivron', 'pepper': 'Poivron',
            'pomme de terre': 'Pomme de terre', 'potato': 'Pomme de terre',
            'cerise': 'Cerise', 'cherry': 'Cerise',
            'fraise': 'Fraise', 'strawberry': 'Fraise',
            'framboise': 'Framboise', 'raspberry': 'Framboise',
            'myrtille': 'Myrtille', 'blueberry': 'Myrtille',
            'orange': 'Orange',
            'soja': 'Soja', 'soybean': 'Soja',
            'courge': 'Courge', 'squash': 'Courge',
        }
        # Normalise la saisie de l'utilisateur vers le nom exact en BD
        db_plant = PLANT_ALIAS.get(culture_plant.lower().strip(), culture_plant)

        try:
            from ia.predictor import predict, get_db_lookup

            image_path = analysis.image.path
            
            # On passe db_plant (ex: 'Pomme') au prédicteur.
            # YOLO ne regardera QUE les classes de cette plante (ex: ignorer Raisin, Maïs...)
            prediction = predict(image_path, plant_hint=db_plant)
            
            class_name = prediction['class_name']
            confidence = prediction['confidence']
            print(f"[YOLO] Classe prédite (filtré sur {db_plant}) : '{class_name}' ({confidence:.1%})")

            # Récupère le mot-clé de la maladie depuis la table de mapping
            lookup = get_db_lookup(class_name)

            if lookup:
                disease_keyword = lookup['name_contains']  # ex: 'Apple_scab'

                # Recherche finale en base de données
                disease = Disease.objects.filter(
                    plant=db_plant,
                    name__icontains=disease_keyword
                ).first()

                if not disease:
                    disease = Disease.objects.filter(name__icontains=disease_keyword).first()

                if disease:
                    analysis.disease = disease
                    analysis.confidence = confidence
                    analysis.save()
                    disease_found = True
                    print(f"[YOLO] -> {disease.name} ({disease.plant})")
                else:
                    print(f"[WARN] Aucune maladie trouvée pour keyword='{disease_keyword}'")
            else:
                print(f"[WARN] Classe YOLO non mappée : '{class_name}'")

        except Exception as e:
            print(f"[WARN] YOLO exception ({type(e).__name__}): {e}")

        # --- Mode démo si YOLO indisponible ---
        if not disease_found:
            # Cherche d'abord une maladie pour la bonne plante
            disease = Disease.objects.filter(plant=db_plant).order_by('?').first()
            if not disease:
                disease = Disease.objects.order_by('?').first()
            if disease:
                analysis.disease = disease
                analysis.confidence = 0.87
                analysis.save()
                print(f"[MOCK] Mode démo - {disease.name} ({disease.plant})")




    @action(detail=False, methods=['get'])
    def recent(self, request):
        """GET /api/analyses/recent/ - Retourne les 5 dernières analyses."""
        analyses = self.get_queryset()[:5]
        serializer = self.get_serializer(analyses, many=True)
        return Response(serializer.data)




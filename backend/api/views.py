from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
import google.generativeai as genai
import os
from rest_framework.response import Response
from .models import User, Culture, Disease, Analysis, ChatHistory, Task, InventoryItem, FinanceRecord
from .serializers import (
    UserSerializer, CultureSerializer, DiseaseSerializer,
    AnalysisSerializer, ChatHistorySerializer,
    TaskSerializer, InventoryItemSerializer, FinanceRecordSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        """GET/PUT/PATCH /api/users/me/ - Consulte ou met à jour le profil de l'utilisateur connecté."""
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)

        user = request.user
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        # Gestion du changement de mot de passe si demandé
        new_password = data.pop('new_password', None)
        current_password = data.pop('current_password', None)

        if new_password:
            if not current_password or not user.check_password(current_password):
                return Response(
                    {'error': 'Le mot de passe actuel est incorrect.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if len(new_password) < 6:
                return Response(
                    {'error': 'Le nouveau mot de passe doit contenir au moins 6 caractères.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            data['password'] = new_password

        # Empêcher la modification du rôle via cet endpoint
        data.pop('role', None)

        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

class ChatbotView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """GET /api/chat/ - Retourne l'historique de conversation de l'utilisateur connecté."""
        if request.user and request.user.is_authenticated:
            history = ChatHistory.objects.filter(user=request.user).order_by('date')[:50]
            serializer = ChatHistorySerializer(history, many=True)
            return Response(serializer.data)
        return Response([])

    def delete(self, request):
        """DELETE /api/chat/ - Efface l'historique de conversation de l'utilisateur connecté."""
        if request.user and request.user.is_authenticated:
            ChatHistory.objects.filter(user=request.user).delete()
        return Response({'status': 'cleared'}, status=status.HTTP_200_OK)

    def post(self, request):
        user_message = request.data.get('message')
        if not user_message:
            return Response({'error': 'Message required'}, status=status.HTTP_400_BAD_REQUEST)
        
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            from dotenv import load_dotenv
            from django.conf import settings
            load_dotenv(settings.BASE_DIR / '.env')
            api_key = os.environ.get("GEMINI_API_KEY")

        if not api_key:
            return Response({'error': 'Gemini API Key missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.8-flash')
        
        diseases = Disease.objects.all()
        context_str = "Tu es un expert agronome de AgriVision. Voici les maladies et plantes que tu peux diagnostiquer :\n"
        for d in diseases:
            context_str += f"- Plante: {d.plant}, Maladie: {d.name}, Symptômes: {d.symptoms}, Traitement: {d.advice}\n"
        
        # Ajouter le contexte des derniers échanges si l'utilisateur est connecté
        history_str = ""
        if request.user and request.user.is_authenticated:
            recent_chats = list(ChatHistory.objects.filter(user=request.user).order_by('-date')[:5])
            if recent_chats:
                history_str = "\nHistorique récent de la conversation :\n"
                for chat in reversed(recent_chats):
                    history_str += f"Agriculteur: {chat.message}\nExpert AgriVision: {chat.response}\n"

        context_str += "\nRéponds de manière concise, empathique et très professionnelle à l'agriculteur. N'invente pas de maladies qui ne sont pas dans la liste, mais tu peux donner des conseils généraux."
        
        prompt = f"{context_str}{history_str}\nQuestion de l'agriculteur:\nAgriculteur: {user_message}\nExpert AgriVision:"
        
        try:
            response = model.generate_content(prompt)
            reply_text = response.text
            chat_record = None
            if request.user and request.user.is_authenticated:
                chat_record = ChatHistory.objects.create(
                    user=request.user,
                    message=user_message,
                    response=reply_text
                )
            return Response({
                'reply': reply_text,
                'id': chat_record.id if chat_record else None,
                'date': chat_record.date if chat_record else None,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InventoryItem.objects.filter(user=self.request.user).order_by('name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FinanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = FinanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FinanceRecord.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

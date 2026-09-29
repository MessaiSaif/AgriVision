from django.contrib import admin
from .models import User, Culture, Disease, Analysis, ChatHistory

# Enregistre tous les modèles dans l'interface d'admin Django
# Accès via http://127.0.0.1:8000/admin/ avec les identifiants admin/admin
admin.site.register(User)
admin.site.register(Culture)
admin.site.register(Disease)
admin.site.register(Analysis)
admin.site.register(ChatHistory)

admin.site.site_header = "AgriVision Administration"
admin.site.site_title = "AgriVision Admin"

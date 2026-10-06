import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "agrivision_backend.settings")
django.setup()

from api.models import Disease, User

def seed():
    if not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin", 
            email="admin@agrivision.com", 
            password="admin", 
            role="ADMINISTRATEUR"
        )
        print("Super-administrateur 'admin' créé avec succès (mot de passe: admin).")
    else:
        print("Le super-administrateur existe déjà.")

    if not User.objects.filter(username="agri").exists():
        User.objects.create_user(
            username="agri",
            email="agri@agrivision.com",
            password="agri",
            role="AGRICULTEUR"
        )
        print("Agriculteur 'agri' créé avec succès (mot de passe: agri).")
    else:
        print("L'agriculteur 'agri' existe déjà.")

    diseases_data = [
        # --- POMME (Apple) ---
        {
            "name": "Apple_scab (Tavelure)", "plant": "Pomme",
            "description": "Maladie fongique très répandue causée par Venturia inaequalis.",
            "symptoms": "Taches veloutées brun olive ou noires sur les feuilles et les fruits.",
            "advice": "Ramassez les feuilles mortes en automne. Traitements fongicides préventifs."
        },
        {
            "name": "Black_rot (Pourriture noire)", "plant": "Pomme",
            "description": "Maladie fongique provoquant la pourriture des fruits.",
            "symptoms": "Taches brunes sur les feuilles, pourriture des fruits avec des anneaux concentriques.",
            "advice": "Taillez les branches mortes et appliquez un fongicide au cuivre."
        },
        {
            "name": "Cedar_apple_rust (Rouille grillagée)", "plant": "Pomme",
            "description": "Maladie fongique nécessitant le genévrier comme hôte intermédiaire.",
            "symptoms": "Taches jaune-orangé sur les feuilles, souvent avec des protubérances en dessous.",
            "advice": "Éliminez les genévriers à proximité. Utilisez des fongicides protecteurs."
        },
        {
            "name": "Healthy", "plant": "Pomme",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- MYRTILLE (Blueberry) ---
        {
            "name": "Healthy", "plant": "Myrtille",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Maintenez un sol acide."
        },

        # --- CERISE (Cherry) ---
        {
            "name": "Powdery_mildew (Oïdium)", "plant": "Cerise",
            "description": "Maladie causée par un champignon qui forme un feutrage blanc.",
            "symptoms": "Dépôt poudreux blanc à grisâtre sur les feuilles et jeunes pousses.",
            "advice": "Éliminez les rameaux atteints. Traitez au soufre."
        },
        {
            "name": "Healthy", "plant": "Cerise",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- MAÏS (Corn) ---
        {
            "name": "Cercospora_leaf_spot (Cercosporiose)", "plant": "Maïs",
            "description": "Maladie fongique courante dans les régions chaudes et humides.",
            "symptoms": "Lésions rectangulaires grisâtres sur les feuilles, limitées par les nervures.",
            "advice": "Utilisez des hybrides tolérants et pratiquez la rotation des cultures."
        },
        {
            "name": "Common_rust (Rouille commune)", "plant": "Maïs",
            "description": "Maladie fongique favorisée par des températures fraîches.",
            "symptoms": "Pustules rouge brique à brun foncé sur les feuilles.",
            "advice": "Appliquez un fongicide si l'infection est précoce et sévère."
        },
        {
            "name": "Northern_Leaf_Blight (Helminthosporiose)", "plant": "Maïs",
            "description": "Maladie causée par le champignon Exserohilum turcicum.",
            "symptoms": "Grandes lésions gris-vert à brunes en forme de cigare sur les feuilles.",
            "advice": "Enfouissez les résidus de culture et plantez des variétés résistantes."
        },
        {
            "name": "Healthy", "plant": "Maïs",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- RAISIN (Grape) ---
        {
            "name": "Black_rot (Pourriture noire)", "plant": "Raisin",
            "description": "Maladie fongique dévastatrice pour la vigne.",
            "symptoms": "Petites taches brunes sur les feuilles, les baies pourrissent et se momifient.",
            "advice": "Retirez les grappes momifiées et appliquez un traitement au cuivre."
        },
        {
            "name": "Esca (Black Measles)", "plant": "Raisin",
            "description": "Maladie du bois complexe causée par plusieurs champignons.",
            "symptoms": "Taches tigrées sur les feuilles (jaunes et rouges). Dessèchement brutal.",
            "advice": "Évitez les grosses plaies de taille. Traitez à l'arsénite (si autorisé) ou utilisez des méthodes de curetage."
        },
        {
            "name": "Leaf_blight (Isariopsis)", "plant": "Raisin",
            "description": "Maladie affectant le feuillage de la vigne en fin de saison.",
            "symptoms": "Taches angulaires rouge-brun sur les feuilles, chute prématurée des feuilles.",
            "advice": "Garantissez une bonne aération du feuillage."
        },
        {
            "name": "Healthy", "plant": "Raisin",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- ORANGE ---
        {
            "name": "Haunglongbing (Citrus greening)", "plant": "Orange",
            "description": "Maladie bactérienne incurable transmise par un psylle.",
            "symptoms": "Feuilles jaunies asymétriques, fruits petits, verts et amers.",
            "advice": "Maladie mortelle. Détruisez l'arbre pour éviter la propagation. Contrôlez les insectes vecteurs."
        },

        # --- PÊCHE (Peach) ---
        {
            "name": "Bacterial_spot (Tache bactérienne)", "plant": "Pêche",
            "description": "Infection bactérienne (Xanthomonas).",
            "symptoms": "Petites taches angulaires gorgées d'eau sur les feuilles, aspect criblé.",
            "advice": "Pulvérisez du cuivre à la chute des feuilles et avant le débourrement."
        },
        {
            "name": "Healthy", "plant": "Pêche",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- POIVRON (Bell Pepper) ---
        {
            "name": "Bacterial_spot (Tache bactérienne)", "plant": "Poivron",
            "description": "Maladie bactérienne très commune et destructrice.",
            "symptoms": "Taches brunes sur les feuilles et les fruits. Chute des feuilles.",
            "advice": "Évitez l'arrosage par le dessus. Appliquez des traitements cupriques."
        },
        {
            "name": "Healthy", "plant": "Poivron",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- POMME DE TERRE (Potato) ---
        {
            "name": "Early_blight (Alternariose)", "plant": "Pomme de terre",
            "description": "Maladie fongique courante (Alternaria solani).",
            "symptoms": "Taches brunes concentriques sur les vieilles feuilles.",
            "advice": "Appliquez des fongicides, pratiquez la rotation."
        },
        {
            "name": "Late_blight (Mildiou)", "plant": "Pomme de terre",
            "description": "Maladie fulgurante et très destructrice (Phytophthora infestans).",
            "symptoms": "Grandes taches brunes et duvet blanc par temps humide.",
            "advice": "Détruisez les plants atteints. Traitement préventif à la bouillie bordelaise."
        },
        {
            "name": "Healthy", "plant": "Pomme de terre",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- FRAMBOISE (Raspberry) ---
        {
            "name": "Healthy", "plant": "Framboise",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- SOJA (Soybean) ---
        {
            "name": "Healthy", "plant": "Soja",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- COURGE (Squash) ---
        {
            "name": "Powdery_mildew (Oïdium)", "plant": "Courge",
            "description": "Maladie fongique recouvrant le feuillage.",
            "symptoms": "Poudre blanche sur les feuilles et les tiges.",
            "advice": "Appliquez du soufre ou du bicarbonate de soude."
        },

        # --- FRAISE (Strawberry) ---
        {
            "name": "Leaf_scorch (Tache pourpre)", "plant": "Fraise",
            "description": "Maladie fongique causant la nécrose des feuilles.",
            "symptoms": "Taches pourpres à violettes sur la face supérieure des feuilles.",
            "advice": "Retirez le feuillage infecté après la récolte."
        },
        {
            "name": "Healthy", "plant": "Fraise",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        },

        # --- TOMATE (Tomato) ---
        {
            "name": "Bacterial_spot (Tache bactérienne)", "plant": "Tomate",
            "description": "Maladie causée par des bactéries Xanthomonas.",
            "symptoms": "Petites taches brun foncé sur les feuilles et croûtes sur les fruits.",
            "advice": "Utilisez des semences saines, traitements à base de cuivre."
        },
        {
            "name": "Early_blight (Alternariose)", "plant": "Tomate",
            "description": "Maladie fongique attaquant les feuilles du bas.",
            "symptoms": "Taches brunes avec anneaux concentriques.",
            "advice": "Retirez les feuilles touchées, appliquez un fongicide."
        },
        {
            "name": "Late_blight (Mildiou)", "plant": "Tomate",
            "description": "Maladie hautement destructrice en milieu humide.",
            "symptoms": "Taches brunes rapides, duvet blanc sous les feuilles.",
            "advice": "Arrachez les plants malades. Protégez de la pluie."
        },
        {
            "name": "Leaf_Mold (Cladosporiose)", "plant": "Tomate",
            "description": "Maladie fongique favorisée par une humidité stagnante (serre).",
            "symptoms": "Taches jaunes diffuses et duvet gris violacé sous la feuille.",
            "advice": "Aérez les serres, évitez de mouiller le feuillage."
        },
        {
            "name": "Septoria_leaf_spot (Septoriose)", "plant": "Tomate",
            "description": "Maladie fongique du feuillage causant une défoliation.",
            "symptoms": "Multiples petites taches circulaires avec centre gris clair.",
            "advice": "Retirez les feuilles malades, utilisez un fongicide cuivré."
        },
        {
            "name": "Spider_mites (Tétranyques tisserands)", "plant": "Tomate",
            "description": "Attaque d'acariens minuscules (araignées rouges) par temps sec.",
            "symptoms": "Feuilles jaunies, piquetées, présence de fines toiles d'araignée.",
            "advice": "Brumisez de l'eau sur le feuillage, utilisez des acariens prédateurs ou du savon noir."
        },
        {
            "name": "Target_Spot (Corynespora)", "plant": "Tomate",
            "description": "Maladie fongique aimant la chaleur et l'humidité.",
            "symptoms": "Taches brunes avec un halo jaune (en forme de cible).",
            "advice": "Assurez une bonne ventilation. Appliquez des fongicides spécifiques."
        },
        {
            "name": "Tomato_Yellow_Leaf_Curl_Virus (TYLCV)", "plant": "Tomate",
            "description": "Maladie virale grave transmise par les aleurodes (mouches blanches).",
            "symptoms": "Feuilles jaunies, recroquevillées vers le haut, croissance stoppée.",
            "advice": "Maladie incurable. Arrachez le plant. Luttez contre les mouches blanches avec des filets."
        },
        {
            "name": "Tomato_mosaic_virus (Virus de la mosaïque)", "plant": "Tomate",
            "description": "Maladie virale très contagieuse (par le toucher, les outils).",
            "symptoms": "Feuilles marbrées vert clair/foncé (mosaïque), feuilles déformées.",
            "advice": "Détruisez les plants, désinfectez vos outils et vos mains. Ne fumez pas près des plants."
        },
        {
            "name": "Healthy", "plant": "Tomate",
            "description": "Plante saine.", "symptoms": "Aucun.", "advice": "Continuez l'entretien habituel."
        }
    ]

    count = 0
    for data in diseases_data:
        obj, created = Disease.objects.update_or_create(
            name=data["name"],
            plant=data["plant"],
            defaults={
                "description": data["description"],
                "symptoms": data["symptoms"],
                "advice": data["advice"]
            }
        )
        if created:
            count += 1
    
    print(f"{len(diseases_data)} classes (maladies/saines) ont été insérées/mises à jour dans la base.")

if __name__ == "__main__":
    seed()

"""
Module d'inférence YOLO pour AgriVision.
Ce fichier charge le modèle entraîné et mappe les 38 classes YOLO
vers les entrées correspondantes dans la base de données Django.
"""

import os
from ultralytics import YOLO

# Chemin vers le modèle entraîné
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    '..', 'runs', 'classify', 'AgriVision_Models', 'v1_classification', 'weights', 'best.pt'
)

# Instance globale (chargée une seule fois au démarrage du serveur)
_model = None


def get_model():
    """Charge le modèle YOLO en mémoire (singleton)."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Modèle YOLO introuvable : {MODEL_PATH}. "
                "Exécutez d'abord ia/train_yolo.py."
            )
        _model = YOLO(MODEL_PATH)
        print(f"[YOLO] Modèle chargé depuis : {MODEL_PATH}")
    return _model


def predict(image_path: str, plant_hint: str = None) -> dict:
    """
    Prédit la classe d'une image.
    Si plant_hint est fourni, filtre les résultats pour ne regarder que les maladies de cette plante.
    Retourne: {'class_name': str, 'confidence': float}
    """
    model = get_model()
    results = model.predict(source=image_path, imgsz=224, verbose=False)
    
    probs = results[0].probs.data
    names = results[0].names  # dict: {0: 'Apple___Apple_scab', ...}
    
    if plant_hint:
        # Trouve les indices YOLO qui correspondent à la plante demandée
        allowed_indices = []
        for idx, class_name in names.items():
            db_lookup = CLASS_TO_DB_MAP.get(class_name)
            if db_lookup and db_lookup['plant'] == plant_hint:
                allowed_indices.append(idx)
        
        if allowed_indices:
            # Trouve l'index avec la plus grande probabilité parmi les choix autorisés
            best_idx = max(allowed_indices, key=lambda idx: float(probs[idx]))
            confidence = float(probs[best_idx])
            
            # Si la confiance absolue est très basse mais qu'on a forcé la plante, 
            # on booste légèrement la confiance pour l'UI, car on a éliminé le "bruit" des autres plantes.
            if confidence < 0.5:
                # Recalcule par rapport à la somme des probs autorisées
                sum_allowed = sum(float(probs[i]) for i in allowed_indices)
                if sum_allowed > 0:
                    confidence = float(probs[best_idx]) / sum_allowed
                    # Plafond à 0.85 pour rester réaliste sur une prédiction incertaine
                    confidence = min(0.85, confidence)

            return {'class_name': names[best_idx], 'confidence': confidence}

    # Fallback normal si pas de plant_hint ou aucun index trouvé
    top1_idx = results[0].probs.top1
    confidence = float(results[0].probs.top1conf)
    class_name = names[top1_idx]
    return {'class_name': class_name, 'confidence': confidence}


# ---------------------------------------------------------------
# TABLE DE MAPPING COMPLÈTE : 38 classes PlantVillage → Base de données
#
# Format : 'NomClasseYOLO': {'plant': 'NomPlanteBD', 'name_contains': 'MotCléBD'}
#
# 'plant' doit correspondre exactement au champ 'plant' dans Disease (ex: 'Tomate').
# 'name_contains' est utilisé pour une recherche case-insensitive dans le champ 'name'.
# ---------------------------------------------------------------
CLASS_TO_DB_MAP = {
    # --- POMME (Apple) ---
    'Apple___Apple_scab':                       {'plant': 'Pomme',           'name_contains': 'Apple_scab'},
    'Apple___Black_rot':                        {'plant': 'Pomme',           'name_contains': 'Black_rot'},
    'Apple___Cedar_apple_rust':                 {'plant': 'Pomme',           'name_contains': 'Cedar_apple_rust'},
    'Apple___healthy':                          {'plant': 'Pomme',           'name_contains': 'Healthy'},

    # --- MYRTILLE (Blueberry) ---
    'Blueberry___healthy':                      {'plant': 'Myrtille',        'name_contains': 'Healthy'},

    # --- CERISE (Cherry) ---
    'Cherry_(including_sour)___Powdery_mildew': {'plant': 'Cerise',          'name_contains': 'Powdery_mildew'},
    'Cherry_(including_sour)___healthy':        {'plant': 'Cerise',          'name_contains': 'Healthy'},

    # --- MAÏS (Corn) ---
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {'plant': 'Maïs',  'name_contains': 'Cercospora'},
    'Corn_(maize)___Common_rust_':              {'plant': 'Maïs',            'name_contains': 'Common_rust'},
    'Corn_(maize)___Northern_Leaf_Blight':      {'plant': 'Maïs',            'name_contains': 'Northern'},
    'Corn_(maize)___healthy':                   {'plant': 'Maïs',            'name_contains': 'Healthy'},

    # --- RAISIN (Grape) ---
    'Grape___Black_rot':                        {'plant': 'Raisin',          'name_contains': 'Black_rot'},
    'Grape___Esca_(Black_Measles)':             {'plant': 'Raisin',          'name_contains': 'Esca'},
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {'plant': 'Raisin',        'name_contains': 'Leaf_blight'},
    'Grape___healthy':                          {'plant': 'Raisin',          'name_contains': 'Healthy'},

    # --- ORANGE ---
    'Orange___Haunglongbing_(Citrus_greening)': {'plant': 'Orange',          'name_contains': 'Haunglongbing'},

    # --- PÊCHE (Peach) ---
    'Peach___Bacterial_spot':                   {'plant': 'Pêche',           'name_contains': 'Bacterial_spot'},
    'Peach___healthy':                          {'plant': 'Pêche',           'name_contains': 'Healthy'},

    # --- POIVRON (Pepper) ---
    'Pepper,_bell___Bacterial_spot':            {'plant': 'Poivron',         'name_contains': 'Bacterial_spot'},
    'Pepper,_bell___healthy':                   {'plant': 'Poivron',         'name_contains': 'Healthy'},

    # --- POMME DE TERRE (Potato) ---
    'Potato___Early_blight':                    {'plant': 'Pomme de terre',  'name_contains': 'Early_blight'},
    'Potato___Late_blight':                     {'plant': 'Pomme de terre',  'name_contains': 'Late_blight'},
    'Potato___healthy':                         {'plant': 'Pomme de terre',  'name_contains': 'Healthy'},

    # --- FRAMBOISE (Raspberry) ---
    'Raspberry___healthy':                      {'plant': 'Framboise',       'name_contains': 'Healthy'},

    # --- SOJA (Soybean) ---
    'Soybean___healthy':                        {'plant': 'Soja',            'name_contains': 'Healthy'},

    # --- COURGE (Squash) ---
    'Squash___Powdery_mildew':                  {'plant': 'Courge',          'name_contains': 'Powdery_mildew'},

    # --- FRAISE (Strawberry) ---
    'Strawberry___Leaf_scorch':                 {'plant': 'Fraise',          'name_contains': 'Leaf_scorch'},
    'Strawberry___healthy':                     {'plant': 'Fraise',          'name_contains': 'Healthy'},

    # --- TOMATE (Tomato) ---
    'Tomato___Bacterial_spot':                  {'plant': 'Tomate',          'name_contains': 'Bacterial_spot'},
    'Tomato___Early_blight':                    {'plant': 'Tomate',          'name_contains': 'Early_blight'},
    'Tomato___Late_blight':                     {'plant': 'Tomate',          'name_contains': 'Late_blight'},
    'Tomato___Leaf_Mold':                       {'plant': 'Tomate',          'name_contains': 'Leaf_Mold'},
    'Tomato___Septoria_leaf_spot':              {'plant': 'Tomate',          'name_contains': 'Septoria'},
    'Tomato___Spider_mites Two-spotted_spider_mite': {'plant': 'Tomate',     'name_contains': 'Spider'},
    'Tomato___Target_Spot':                     {'plant': 'Tomate',          'name_contains': 'Target_Spot'},
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus':   {'plant': 'Tomate',          'name_contains': 'Yellow'},
    'Tomato___Tomato_mosaic_virus':             {'plant': 'Tomate',          'name_contains': 'mosaic'},
    'Tomato___healthy':                         {'plant': 'Tomate',          'name_contains': 'Healthy'},
}


def get_db_lookup(class_name: str) -> dict | None:
    """
    Retourne le dictionnaire de recherche DB pour une classe YOLO donnée.
    Retourne None si la classe n'est pas dans la table de mapping.
    """
    return CLASS_TO_DB_MAP.get(class_name, None)

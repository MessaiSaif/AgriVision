import os
from ultralytics import YOLO
import splitfolders

# ---------------------------------------------------------
# SCRIPT COMPLET D'ENTRAÎNEMENT YOLOv8
# ---------------------------------------------------------

def prepare_dataset():
    input_folder = r"D:\AgriVision\plantvillage dataset\color"
    output_folder = r"D:\AgriVision\dataset_yolo"
    
    if not os.path.exists(output_folder):
        print(f"Préparation du dataset (découpage en train/val)...")
        # Sépare les images : 80% pour l'entraînement, 20% pour la validation
        splitfolders.ratio(input_folder, output=output_folder, seed=42, ratio=(0.8, 0.2))
        print("Dataset préparé avec succès dans :", output_folder)
    else:
        print("Le dataset est déjà découpé dans :", output_folder)
        
    return output_folder

def train_model(dataset_path):
    print("\nDémarrage de l'entraînement YOLOv8...")
    
    # Charger un modèle pré-entraîné YOLOv8 nano pour la classification
    model = YOLO('yolov8n-cls.pt') 
    
    # Entraînement du modèle
    # (PlantVillage comporte 38 classes, le modèle va les détecter automatiquement)
    results = model.train(
        data=dataset_path, 
        epochs=10,       # 10 epochs pour commencer vite (augmenter à 30-50 pour la précision finale)
        imgsz=224,       
        batch=16,        
        project='AgriVision_Models',
        name='v1_classification'
    )
    
    print("\n✅ Entraînement terminé ! Le modèle final est sauvegardé dans : AgriVision_Models/v1_classification/weights/best.pt")

if __name__ == "__main__":
    # 1. On sépare le dossier téléchargé en train/val pour YOLO
    dataset_path = prepare_dataset()
    
    # 2. On lance l'entraînement
    train_model(dataset_path)

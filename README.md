# 🌱 AgriVision — Plateforme Intelligente de Diagnostic Phytosanitaire & Gestion Agricole

**AgriVision** est une application web full-stack combinant **Vision par Ordinateur (YOLOv8)**, **IA Générative (Google Gemini)** et **ERP Agricole** (Cultures, Tâches, Inventaire, Finances) pour accompagner les agriculteurs dans la protection de leurs récoltes et le pilotage quotidien de leur exploitation.

---

## ✨ Fonctionnalités Principales

### 🔬 1. Diagnostic IA des Maladies (YOLOv8)
- Analyse d'images de feuilles sur **38 classes PlantVillage** couvrant **14 espèces végétales** (*Tomate, Pomme, Pomme de terre, Raisin, Maïs, Pêche, Poivron, Fraise, Cerise, Orange, Courge, Framboise, Myrtille, Soja*).
- **Filtrage contextuel intelligent (`plant_hint`)** : le prédicteur restreint l'inférence aux classes correspondant à l'espèce de la parcelle sélectionnée.
- Restitution immédiate du taux de confiance, de la description, des symptômes et du protocole de traitement recommandé.

### 🤖 2. Expert Agronome IA (Chatbot Google Gemini)
- Assistant conversationnel flottant accessible depuis toute l'application.
- Contextualisé avec l'intégralité du catalogue des maladies de la base de données.
- **Mémoire conversationnelle persistante (`ChatHistory`)** : sauvegarde automatique et rechargement de l'historique des échanges pour chaque agriculteur connecté, avec option d'effacement.

### 🚜 3. Gestion Complète de l'Exploitation (ERP Agricole)
- **Mes Cultures (`/dashboard`)** : suivi des parcelles, dates de plantation, localisation et lancement rapide d'analyse.
- **Historique Détaillé des Analyses (`/dashboard`)** : miniatures des feuilles analysées, culture associée, fiche diagnostic dépliable et suppression.
- **Mes Tâches (`/tasks`)** : gestion des travaux agricoles (*En attente*, *En cours*, *Terminé*) associés aux parcelles.
- **Inventaire (`/inventory`)** : suivi des stocks d'intrants (*Engrais, Pesticides, Semences, Équipement*), ajustement rapide (`+1` / `-1`), édition complète et alerte de stock faible.
- **Finances (`/finances`)** : suivi des revenus et dépenses avec calcul automatique du bilan net.
- **Paramètres du Compte (`/dashboard`)** : mise à jour du profil (`username`, `email`) et changement sécurisé du mot de passe.

### ⚡ 4. Smart Workflows (Modules Interconnectés)
- **Diagnostic IA $\rightarrow$ Planification de Tâche en 1 clic** : depuis un résultat d'analyse (page d'accueil ou historique), un bouton *« Planifier le traitement dans Mes Tâches »* crée automatiquement une tâche liée à la parcelle avec le traitement recommandé.
- **Inventaire $\rightarrow$ Synchronisation Financière** : lors de l'ajout ou de la modification d'un stock d'intrant, une option permet d'enregistrer automatiquement l'achat comme dépense dans le module **Finances**.

---

## 🛠️ Stack Technique

| Couche | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router 7, Axios, Lucide React, CSS Glassmorphism |
| **Backend** | Python, Django 6, Django REST Framework, SimpleJWT, CORS Headers |
| **Intelligence Artificielle** | Ultralytics YOLOv8 (`yolov8n-cls.pt`), PyTorch, Google Generative AI (`Gemini`) |
| **Base de Données** | PostgreSQL (Docker Compose inclus) |

---

## 🚀 Installation et Démarrage Rapide

### 1. Cloner le dépôt
```bash
git clone https://github.com/Yassino14/AgriVision.git
cd AgriVision
```

### 2. Démarrer la base de données PostgreSQL
```bash
docker-compose up -d
```

### 3. Configurer et lancer le Backend (Django)
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Sur Windows (ou source venv/bin/activate sur Linux/Mac)
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers pillow python-dotenv psycopg2-binary ultralytics google-generativeai
```
Créez un fichier `backend/.env` contenant votre clé API Gemini :
```env
GEMINI_API_KEY=votre_cle_api_gemini
```
Appliquez les migrations, initialisez le catalogue des maladies et lancez le serveur :
```bash
python manage.py migrate
python seed_data.py
python manage.py runserver
```

### 4. Configurer et lancer le Frontend (React + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
L'application est accessible sur `http://localhost:5173` et l'API sur `http://127.0.0.1:8000/api/`.

---

## 📄 Documentation du Projet
- [Cahier des charges complet (Markdown)](./Cahier_des_charges_AgriVision.md) | [Version PDF](./Cahier_des_charges_AgriVision.pdf)
- [Documentation Technique & Spécifications UML (Markdown)](./Documentation_UML_AgriVision.md) | [Version PDF](./Documentation_Technique_UML_AgriVision.pdf)

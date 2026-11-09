# AGRIVISION — Cahier des charges
**Plateforme web intelligente de détection des maladies des plantes par IA et de gestion d'exploitation agricole**  
*Projet universitaire — Développement en groupe de 3*

---

## 1. Objectif du projet
Concevoir une application web complète permettant à un agriculteur d'enregistrer ses cultures, d'envoyer la photographie d'une feuille pour obtenir un diagnostic précis de maladie réalisé par un modèle de vision par ordinateur (**YOLOv8**), d'interagir avec un assistant agronome IA (**Google Gemini**), et de piloter l'ensemble de son exploitation (tâches agricoles, inventaire des intrants et finances) grâce à des flux intelligents interconnectés (*Smart Workflows*).

| Composant | Technologie retenue |
| :--- | :--- |
| **Frontend** | React 19 + Vite (Interface Glassmorphism responsive) |
| **Backend** | Django 6 + Django REST Framework + SimpleJWT |
| **Base de données** | PostgreSQL |
| **Intelligence artificielle** | Python + Ultralytics YOLOv8 (38 classes PlantVillage) + Google Gemini API |

---

## 2. Présentation du projet
**AgriVision** est une plateforme web conçue pour accompagner les agriculteurs au quotidien dans la surveillance sanitaire de leurs parcelles et la gestion opérationnelle de leur ferme. L'utilisateur principal (l'agriculteur) crée ses cultures parmi **14 espèces végétales**, téléverse une photo de feuille et lance une analyse. Le système transmet l'image au modèle **YOLOv8** en filtrant intelligemment sur l'espèce concernée, récupère la maladie prédite ainsi que le niveau de confiance, et affiche le diagnostic détaillé accompagné des symptômes et du traitement recommandé.

Au-delà du diagnostic, AgriVision connecte l'analyse IA directement à l'action sur le terrain : l'agriculteur peut **planifier en un clic une tâche de traitement** dans son agenda agricole et **synchroniser ses achats d'intrants (inventaire) avec sa comptabilité (finances)**.

> **Principe central :**  
> `Image de la plante + Culture sélectionnée` $\rightarrow$ `Analyse YOLOv8 filtrée par espèce` $\rightarrow$ `Maladie prédite + Confiance + Traitement` $\rightarrow$ `Sauvegarde dans l'historique` $\rightarrow$ `Planification automatique du traitement (Smart Workflow)`.

---

## 3. Acteurs du système

| Acteur | Rôle | Principales actions |
| :--- | :--- | :--- |
| **Agriculteur** | Utilisateur principal | Créer un compte, gérer son profil et mot de passe, gérer ses cultures, lancer une analyse IA, consulter l'historique détaillé, planifier des tâches de traitement, gérer son inventaire d'intrants, suivre ses finances et dialoguer avec l'expert IA. |
| **Administrateur** | Gestion de la plateforme | Superviser la plateforme via l'interface d'administration Django : gérer les utilisateurs, les rôles, les cultures, les analyses et enrichir le catalogue des maladies. |
| **Système IA (YOLOv8 & Gemini)** | Composant automatique | Analyser une image de feuille, prédire une maladie parmi 38 classes avec un score de confiance, et répondre aux questions agronomiques via le chatbot contextuel. |

---

## 4. Fonctionnalités détaillées

### 4.1. Authentification & Gestion du profil (`Paramètres`)
* Création de compte sécurisée pour l'agriculteur.
* Connexion et déconnexion par jetons JWT (`access` & `refresh` tokens).
* Gestion de deux rôles distincts : **Agriculteur** et **Administrateur**.
* Onglet **Paramètres du Compte** permettant de modifier son nom d'utilisateur, son adresse e-mail et son mot de passe (avec vérification du mot de passe actuel).

### 4.2. Gestion des cultures (`Mes Cultures`)
* Ajouter une culture avec un nom de parcelle, un type de plante (parmi 14 espèces), une date de plantation et une localisation.
* Consulter et supprimer les cultures de l'utilisateur.
* Lancer directement une analyse pré-ciblée sur une culture depuis le Dashboard (`Analyser →`).

### 4.3. Analyse IA des maladies (`Analyseur`)
1. L'agriculteur sélectionne la culture concernée.
2. Il téléverse ou glisse-dépose une photo de feuille.
3. Le backend transmet l'image et l'indice de plante (`plant_hint`) au modèle **YOLOv8**.
4. Le modèle retourne la classe prédite et l'indice de confiance.
5. Le système récupère les informations complètes de la maladie (description, symptômes, traitement) depuis PostgreSQL.
6. Le résultat est affiché à l'écran et sauvegardé automatiquement dans l'historique.

### 4.4. Historique détaillé des analyses (`Historique des Analyses`)
* Affichage de la miniature de la feuille analysée, de la date/heure, du badge de la culture concernée, de la maladie prédite et du pourcentage de confiance.
* Bouton **Diagnostic** permettant de déplier la fiche complète (image grand format, description, symptômes, traitement recommandé).
* Possibilité de supprimer une analyse ou de planifier immédiatement une tâche de traitement.

### 4.5. Gestion des Tâches, de l'Inventaire et des Finances (ERP Agricole)
* **Mes Tâches (`/tasks`)** : Création de tâches liées à une culture avec date d'échéance, suivi du statut (*En attente*, *En cours*, *Terminé*) et badge de la parcelle associée.
* **Inventaire (`/inventory`)** : Gestion des stocks d'intrants (*Engrais*, *Pesticides*, *Semences*, *Équipement*, *Autre*) avec boutons d'ajustement rapide (`+1` / `-1`), alerte visuelle de stock faible, et fenêtre d'édition complète.
* **Finances (`/finances`)** : Enregistrement des revenus et dépenses par catégorie, et calcul automatique en temps réel du bilan financier (Revenus, Dépenses, Solde net).

### 4.6. Flux Intelligents Inter-Modules (*Smart Workflows*)
* **Diagnostic IA $\rightarrow$ Tâche de Traitement en 1 clic** : Après une analyse (sur l'accueil ou dans l'historique), un bouton *« Planifier le traitement dans Mes Tâches »* crée automatiquement une tâche associée à la culture, pré-remplie avec le diagnostic et le protocole de traitement recommandé.
* **Inventaire $\rightarrow$ Dépense Financière automatique** : Lors de l'ajout ou de la modification d'un article en stock, l'agriculteur peut cocher *« Enregistrer cet achat dans les Finances »* pour générer automatiquement la transaction de dépense correspondante.

### 4.7. Catalogue des maladies & Chatbot Expert IA
* **Catalogue (`/diseases`)** : Encyclopédie consultable et filtrable des 38 classes/maladies.
* **Chatbot IA (`Chatbot.jsx` + Google Gemini)** : Assistant agronomique flottant disponible sur toutes les pages. Il s'appuie sur le catalogue des maladies de la base de données et conserve l'**historique persistant des conversations (`ChatHistory`)** de l'agriculteur connecté.

---

## 5. Périmètre de l'intelligence artificielle
Le modèle **YOLOv8** couvre **38 classes (14 espèces végétales)** issues du dataset **PlantVillage** :
* **Plantes supportées :** Pomme, Myrtille, Cerise, Maïs, Raisin, Orange, Pêche, Poivron, Pomme de terre, Framboise, Soja, Courge, Fraise, Tomate.
* **Pipeline IA :** `Dataset PlantVillage` $\rightarrow$ `Préparation & Structuration` $\rightarrow$ `Entraînement YOLOv8-cls` $\rightarrow$ `Filtrage intelligent par espèce (plant_hint)` $\rightarrow$ `Intégration Django REST`.

---

## 6. Modèle de données complet (8 entités)

| Entité | Champs essentiels | Relation |
| :--- | :--- | :--- |
| **User** | `id`, `username`, `email`, `password`, `role` | Possède plusieurs cultures, tâches, stocks, finances et historiques de chat. |
| **Culture** | `id`, `name`, `plant_type`, `planting_date`, `location`, `user_id` | Appartient à un utilisateur ; possède plusieurs analyses et tâches. |
| **Disease** | `id`, `name`, `plant`, `description`, `symptoms`, `advice` | Référentiel des maladies ; associée à plusieurs analyses. |
| **Analysis** | `id`, `image`, `date`, `confidence`, `culture_id`, `disease_id` | Liée à une culture et à une maladie détectée. |
| **ChatHistory** | `id`, `user_id`, `message`, `response`, `date` | Conserve l'historique persistant des échanges avec le Chatbot Gemini. |
| **Task** | `id`, `user_id`, `culture_id`, `title`, `description`, `due_date`, `status` | Tâche agricole planifiée manuellement ou générée par un diagnostic IA. |
| **InventoryItem** | `id`, `user_id`, `name`, `category`, `quantity`, `unit` | Article en stock (engrais, semences, pesticides, équipement). |
| **FinanceRecord** | `id`, `user_id`, `record_type`, `amount`, `date`, `description`, `category` | Transaction financière (`INCOME` ou `EXPENSE`), synchronisable depuis l'inventaire. |

---

## 7. Répartition du travail

| Membre | Responsabilité principale | Tâches réalisées |
| :--- | :--- | :--- |
| **Membre 1** | Frontend — React & UX | Pages Home, Login, Dashboard, Diseases, Tasks, Inventory, Finances, Chatbot, Paramètres et Smart Workflows. |
| **Membre 2** | Backend — Django REST & BDD | Modélisation PostgreSQL (8 entités), API RESTful, authentification JWT, sérialiseurs et logique métier. |
| **Membre 3** | IA — YOLOv8 & Gemini | Préparation PlantVillage (38 classes), entraînement YOLOv8, prédicteur filtré par plante et intégration du Chatbot Gemini avec mémoire. |

<div align="center">

<img src="logo/Logo_dit.png" alt="DIT Logo" width="120"/>

# 📚 Bibliothèque Numérique DIT

### Plateforme de gestion de bibliothèque intelligente — Master 2 IA · DIT Sénégal

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![DVC](https://img.shields.io/badge/DVC-Pipeline_ML-945DD6?style=flat-square&logo=dvc&logoColor=white)](https://dvc.org/)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=flat-square&logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![License](https://img.shields.io/badge/Licence-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📋 Table des matières

- [🎯 Vue d'ensemble](#-vue-densemble)
- [🏗️ Architecture microservices](#️-architecture-microservices)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🛠️ Stack technique](#️-stack-technique)
- [🚀 Démarrage rapide](#-démarrage-rapide)
- [🔌 Services & Ports](#-services--ports)
- [📡 API Reference](#-api-reference)
- [👤 Comptes de démonstration](#-comptes-de-démonstration)
- [📊 Pipeline ML avec DVC](#-pipeline-ml-avec-dvc)
- [🔁 CI/CD avec Jenkins](#-cicd-avec-jenkins)
- [🗂️ Structure du projet](#️-structure-du-projet)
- [📐 Règles métier](#-règles-métier)

---

## 🎯 Vue d'ensemble

La **Bibliothèque Numérique DIT** est une plateforme complète de gestion de bibliothèque universitaire construite sur une architecture **microservices**. Elle offre :

- 📖 Catalogue de **150+ livres** techniques (IA, Data Science, DevOps, etc.)
- 👥 Gestion des **utilisateurs** avec authentification JWT
- 📋 Système d'**emprunts** avec calcul automatique des pénalités
- 🤖 **Recommandations personnalisées** par algorithme SVD (Machine Learning)
- 📊 **Tableau de bord** administrateur complet
- ⚙️ **Pipeline ML** versionné avec DVC
- 🔄 **CI/CD** automatisé avec Jenkins

---

## 🏗️ Architecture microservices

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR CLIENT                            │
│                    http://localhost:3000                            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP / REST
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND  (React 18)                            │
│                  Container : bibliotheque_frontend                  │
│                        Port 3000                                    │
└──────┬──────────────┬──────────────┬───────────────┬───────────────┘
       │              │              │               │
       ▼              ▼              ▼               ▼
  ┌─────────┐   ┌──────────┐  ┌──────────┐   ┌──────────────┐
  │ service │   │ service  │  │ service  │   │   service    │
  │ livres  │   │utilisat. │  │emprunts  │   │recommandation│
  │  :3001  │   │  :3002   │  │  :3003   │   │    :3004     │
  │ Node.js │   │ Node.js  │  │ Node.js  │   │   FastAPI    │
  └────┬────┘   └────┬─────┘  └────┬─────┘   └──────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │      PostgreSQL 15               │
              │  Container : bibliotheque_db     │
              │       Port 5432                  │
              │  • utilisateurs  • livres        │
              │  • emprunts      • notes         │
              └─────────────────────────────────┘
```

---

## ✨ Fonctionnalités

### 👤 Gestion des utilisateurs
| Fonctionnalité | Description |
|---|---|
| 🔐 Inscription / Connexion | Authentification JWT sécurisée |
| 🎓 Rôles | `étudiant`, `professeur`, `personnel (gestionnaire)` |
| 🔑 Token JWT | Validité 24h, requis pour les actions protégées |

### 📚 Catalogue de livres
| Fonctionnalité | Description |
|---|---|
| 🔍 Recherche | Par titre, auteur ou ISBN |
| 🏷️ Catégories | IA, Data Science, DevOps, Robotique, NLP, etc. |
| 📦 Stock | Suivi en temps réel des exemplaires disponibles |
| ✏️ Admin | Ajout, modification, suppression de livres |

### 📋 Gestion des emprunts
| Fonctionnalité | Description |
|---|---|
| ⏱️ Durée | **30 jours** maximum par emprunt |
| 🚫 Limite | **3 emprunts simultanés** maximum par utilisateur |
| ⚠️ Retard | Détection automatique au-delà de 30 jours |
| 💰 Pénalités | **500 FCFA / jour** de retard |
| ↩️ Retour | Traité exclusivement par le gestionnaire |

### 🤖 Recommandations personnalisées
| Scénario | Comportement |
|---|---|
| ✅ Utilisateur dans le modèle SVD | Recommandations par filtrage collaboratif |
| ✅ ≥ 5 emprunts (hors modèle) | Fallback : livres populaires dans vos catégories préférées |
| ❌ < 5 emprunts | Message explicite invitant à emprunter davantage |

### 📊 Tableau de bord gestionnaire
- 📈 Statistiques globales (livres, emprunts, retards, pénalités)
- 🏆 Top 5 livres les plus empruntés
- 👑 Top 5 utilisateurs les plus actifs
- 📅 Activité mensuelle des 6 derniers mois
- ⏰ Échéances imminentes (J+3)

---

## 🛠️ Stack technique

### Backend
| Service | Technologie | Rôle |
|---|---|---|
| `service-livres` | Node.js 20 · Express · PostgreSQL | CRUD livres |
| `service-utilisateurs` | Node.js 20 · Express · JWT · bcrypt | Auth & utilisateurs |
| `service-emprunts` | Node.js 20 · Express · PostgreSQL | Emprunts & pénalités |
| `service-recommandation` | Python 3.11 · FastAPI · scikit-surprise | SVD + fallback ML |

### Frontend
| Élément | Technologie |
|---|---|
| Framework | React 18 |
| HTTP Client | Axios |
| Style | CSS-in-JS (inline styles DIT Palette) |

### Infrastructure
| Outil | Usage |
|---|---|
| 🐳 Docker Compose | Orchestration des 6 conteneurs |
| 🐘 PostgreSQL 15 | Base de données relationnelle |
| 📦 DVC | Versionnage des données et modèles ML |
| 🔄 Jenkins | Pipeline CI/CD automatisé |
| 🔐 JWT | Authentification inter-services |

---

## 🚀 Démarrage rapide

### Prérequis

```bash
docker --version   # >= 20.x
docker-compose --version  # >= 1.29
```

### 1️⃣ Cloner le projet

```bash
git clone <url-du-repo>
cd Bibliotheque_DIT
```

### 2️⃣ Lancer tous les services

```bash
# Démarrage complet (premier lancement — build inclus)
docker-compose up --build -d

# Vérifier que tous les services sont opérationnels
docker-compose ps
```

### 3️⃣ Accéder à l'application

| Interface | URL |
|---|---|
| 🌐 Application Web | http://localhost:3000 |
| 📚 API Livres | http://localhost:3001 |
| 👥 API Utilisateurs | http://localhost:3002 |
| 📋 API Emprunts | http://localhost:3003 |
| 🤖 API Recommandation | http://localhost:3004 |

### 4️⃣ Réinitialiser la base de données

```bash
# Supprime les volumes et recrée tout (Linux / macOS / Windows)
docker-compose down -v
docker-compose up --build -d
```

### 5️⃣ Corriger les mots de passe (base existante)

Si les utilisateurs ne peuvent pas se connecter après une mise à jour, exécutez :

```bash
# Compatible Windows / Linux / macOS (nécessite Node.js)
node scripts/fix-passwords.js
```

Ce script détecte et corrige automatiquement les mots de passe non hachés.

---

## 🔌 Services & Ports

```
localhost:3000  →  Frontend React
localhost:3001  →  Service Livres     (Node.js / Express)
localhost:3002  →  Service Utilisateurs (Node.js / Express + JWT)
localhost:3003  →  Service Emprunts   (Node.js / Express)
localhost:3004  →  Service Recommandation (FastAPI / Python)
localhost:5432  →  PostgreSQL 15
```

### Health checks

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

---

## 📡 API Reference

### 📚 Service Livres — `localhost:3001`

```bash
# Lister les livres (paginé)
GET  /api/livres?page=1&limit=20

# Rechercher
GET  /api/livres/search?q=intelligence

# Livres disponibles
GET  /api/livres/disponibles

# Détail d'un livre
GET  /api/livres/:id

# Ajouter un livre (gestionnaire)
POST /api/livres
Body: { titre, auteur, isbn, categorie, editeur, annee_publication, nombre_exemplaires }

# Modifier / Supprimer (gestionnaire)
PUT    /api/livres/:id
DELETE /api/livres/:id
```

### 👥 Service Utilisateurs — `localhost:3002`

```bash
# Inscription
POST /api/auth/register
Body: { nom, prenom, email, mot_de_passe, type_utilisateur }

# Connexion → retourne un token JWT
POST /api/auth/login
Body: { email, mot_de_passe }

# Profil utilisateur connecté
GET /api/utilisateurs/me
Headers: Authorization: Bearer <token>

# Liste des utilisateurs (gestionnaire)
GET /api/utilisateurs?page=1&limit=20
Headers: Authorization: Bearer <token>
```

### 📋 Service Emprunts — `localhost:3003`

```bash
# Créer un emprunt (limite : 3 simultanés)
POST /api/emprunts
Body: { utilisateur_id, livre_id }

# Historique d'un utilisateur
GET  /api/emprunts/utilisateur/:userId

# Détail d'un emprunt (inclut jours_retard et penalite_fcfa)
GET  /api/emprunts/:id

# Retourner un livre (gestionnaire uniquement)
PATCH /api/emprunts/:id/retourner

# Liste des retards avec pénalités
GET  /api/emprunts/penalites

# Statistiques globales
GET  /api/emprunts/stats

# Détecter et mettre à jour les retards
POST /api/emprunts/detecter-retards

# Dashboard admin
GET  /api/admin/dashboard
Headers: Authorization: Bearer <token>

# Historique complet d'un utilisateur (admin)
GET  /api/admin/emprunts/utilisateur/:userId
Headers: Authorization: Bearer <token>
```

### 🤖 Service Recommandation — `localhost:3004`

```bash
# Obtenir des recommandations personnalisées
GET  /api/recommendations/:user_id?top_k=10

# Entraîner le modèle SVD
POST /api/train
Body: { n_factors, n_epochs, lr_all, reg_all }  (optionnel)

# Informations sur le modèle chargé
GET  /api/model/info
```

---

## 👤 Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| 🔑 Gestionnaire (Admin) | `admin@dit.sn` | `admin2026` |
| 🎓 Étudiant | `mamadou1@dit.sn` | `dit2026` |
| 🎓 Étudiant | `fatou2@dit.sn` | `dit2026` |
| 👨‍🏫 Professeur | `ibrahima3@dit.sn` | `dit2026` |
| 👩‍💼 Personnel | `aminata4@dit.sn` | `dit2026` |

> **Mot de passe par défaut de tous les comptes seed :** `dit2026`
>
> Les utilisateurs peuvent aussi s'inscrire librement via l'interface avec leur propre mot de passe.
>
> **Note :** Le gestionnaire a accès au tableau de bord complet, à la gestion des livres, des utilisateurs et peut valider les retours de livres.

---

## 📐 Règles métier

```
📖 DURÉE D'EMPRUNT
   └── 30 jours maximum à partir de la date d'emprunt

🚫 LIMITE D'EMPRUNTS SIMULTANÉS
   └── 3 emprunts actifs maximum par utilisateur
       └── Erreur 409 si dépassement

⚠️ RETARD
   └── Tout dépassement des 30 jours est un retard

💰 CALCUL DES PÉNALITÉS
   └── Pénalité = Jours de retard × 500 FCFA
       Exemple : 5 jours de retard → 2 500 FCFA

↩️ RETOUR DE LIVRE
   └── Visible par l'utilisateur (bouton affiché)
   └── Cliquable et effectif uniquement par le GESTIONNAIRE

🤖 RECOMMANDATIONS
   └── SVD (filtrage collaboratif) si utilisateur dans le modèle
   └── Fallback catégoriel si ≥ 5 emprunts hors modèle
   └── Refus explicite si < 5 emprunts (message d'encouragement)
```

---

## 📊 Pipeline ML avec DVC

Le système de recommandation est alimenté par un pipeline **DVC** versionné.

```
dvc-pipeline/
├── loans.csv           ← Données brutes d'emprunts
├── loans_clean.csv     ← Données nettoyées (preprocess)
├── models/model.pkl    ← Modèle SVD entraîné
├── preprocess.py       ← Nettoyage et formatage
├── train.py            ← Entraînement SVD (scikit-surprise)
├── evaluate.py         ← Métriques RMSE / MAE
└── params.yaml         ← Hyperparamètres (n_factors, n_epochs…)
```

### Commandes DVC

```bash
# Activer l'environnement Python
conda activate bibliotheque2

# Reproduire le pipeline complet
dvc repro

# Voir les métriques du modèle
dvc metrics show

# Comparer avec une version précédente
dvc metrics diff v1.0

# Pousser les artefacts vers le remote
dvc push
```

### Algorithme utilisé

```
Algorithme : SVD (Singular Value Decomposition)
Bibliothèque : scikit-surprise

Paramètres par défaut :
  • n_factors  = 50    (dimensions latentes)
  • n_epochs   = 20    (itérations d'entraînement)
  • lr_all     = 0.005 (taux d'apprentissage)
  • reg_all    = 0.02  (régularisation)

Métriques de performance :
  • RMSE (Root Mean Square Error)
  • MAE  (Mean Absolute Error)
```

---

## 🔁 CI/CD avec Jenkins

Le fichier `Jenkinsfile` à la racine définit le pipeline d'intégration continue :

```groovy
Pipeline Jenkins :
  1. Checkout       → Récupère le code depuis Git
  2. Build          → docker-compose build
  3. Test           → Tests des endpoints health
  4. DVC Pipeline   → dvc repro (entraînement modèle)
  5. Deploy         → docker-compose up -d
  6. Notify         → Notification de succès/échec
```

---

## 🗂️ Structure du projet

```
Bibliotheque_DIT/
│
├── 📁 database/
│   └── init.sql                    ← Schéma PostgreSQL + données de test
│
├── 📁 service-livres/              ← Microservice Livres (Node.js)
│   ├── Dockerfile
│   └── src/
│       ├── controllers/book.controller.js
│       ├── models/book.model.js
│       └── routes/book.routes.js
│
├── 📁 service-utilisateurs/        ← Microservice Auth/Utilisateurs (Node.js)
│   ├── Dockerfile
│   └── src/
│       ├── controllers/auth.controller.js
│       ├── models/user.model.js
│       └── routes/auth.routes.js
│
├── 📁 service-emprunts/            ← Microservice Emprunts (Node.js)
│   ├── Dockerfile
│   └── src/
│       ├── controllers/loan.controller.js
│       ├── controllers/admin.controller.js
│       ├── models/loan.model.js
│       └── routes/loan.routes.js
│
├── 📁 service-recommandation/      ← Microservice ML (FastAPI/Python)
│   ├── Dockerfile
│   ├── main.py                     ← App FastAPI + CORS
│   ├── api/
│   │   ├── routes.py               ← Endpoints + logique fallback
│   │   ├── schemas.py              ← Modèles Pydantic
│   │   └── db.py                   ← Connexion DB + recommandations
│   └── ml/
│       ├── recommender.py          ← Algorithme SVD
│       └── loader.py               ← Chargement du modèle
│
├── 📁 frontend/                    ← Application React 18
│   ├── Dockerfile
│   └── src/
│       ├── App.js                  ← Composant principal (user + admin)
│       └── services/api.js
│
├── 📁 dvc-pipeline/                ← Pipeline ML versionné
│   ├── preprocess.py
│   ├── train.py
│   ├── evaluate.py
│   ├── params.yaml
│   ├── data/loans.csv
│   └── models/model.pkl
│
├── 📁 docs/                        ← Documentation
│   ├── architecture.png
│   ├── api-endpoints.md
│   └── report.pdf
│
├── 📁 metrics/
│   └── metrics.json                ← Métriques DVC exportées
│
├── 🐳 docker-compose.yml           ← Orchestration des 6 conteneurs
├── 🐳 docker-compose.override.yml  ← Surcharges dev
├── ⚙️  Jenkinsfile                  ← Pipeline CI/CD
├── 📄 dvc.yaml                     ← Définition du pipeline DVC
└── 📄 dvc.lock                     ← Verrou des versions DVC
```

---

## 🗃️ Schéma de base de données

```sql
utilisateurs                    livres
─────────────────               ──────────────────────
id            UUID PK           id            UUID PK
nom           VARCHAR           titre         VARCHAR
prenom        VARCHAR           auteur        VARCHAR
email         VARCHAR UNIQUE    isbn          VARCHAR UNIQUE
mot_de_passe  VARCHAR           categorie     VARCHAR
type_utilisateur VARCHAR        editeur       VARCHAR
model_id      VARCHAR           annee_publication INT
actif         BOOLEAN           nombre_exemplaires INT
created_at    TIMESTAMP         exemplaires_disponibles INT
                                model_id      VARCHAR

emprunts                        notes
─────────────────               ──────────────────────
id                  UUID PK     id            UUID PK
utilisateur_id      UUID FK     utilisateur_id UUID FK
livre_id            UUID FK     livre_id      UUID FK
date_emprunt        DATE        note          NUMERIC(2,1)
date_retour_prevue  DATE           [1.0 – 5.0]
date_retour_effective DATE      created_at    TIMESTAMP
statut    VARCHAR  ← en_cours
           (CHECK)    en_retard  UNIQUE(utilisateur_id, livre_id)
                      retourne
jours_retard  [calculé]
penalite_fcfa [calculé: jours × 500 FCFA]
```

---

<div align="center">

**Bibliothèque Numérique DIT** · Master 2 IA · Département Informatique & Télécommunications

*Construit avec ❤️ par l'équipe DIT Sénégal*

[![Made with Docker](https://img.shields.io/badge/Made%20with-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/fr/docs/Web/JavaScript)

</div>

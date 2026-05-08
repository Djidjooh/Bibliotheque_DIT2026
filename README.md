.Bibliotheque_DIT
├── database
│   ├── init.sql
│   └── migrations
├── docker-compose.override.yml
├── docker-compose.yml
├── docs
│   ├── api-endpoints.md
│   ├── architecture.png
│   └── report.pdf
├── dvc.lock
├── dvc-pipeline
│   ├── data
│   │   ├── loans_clean.csv.dvc
│   │   └── loans.csv.dvc
│   ├── evaluate.py
│   ├── models
│   │   └── model.pkl.dvc
│   ├── preprocess.py
│   └── train.py
├── dvc.yaml
├── frontend
│   ├── Dockerfile
│   ├── package.json
│   └── src
│       ├── components
│       ├── pages
│       └── services
│           └── api.js
├── Jenkinsfile
├── metrics
│   └── metrics.json
├── README.md
├── service-emprunts
│   ├── Dockerfile
│   ├── package.json
│   └── src
│       ├── app.js
│       ├── controllers
│       │   └── loan.controller.js
│       ├── export
│       │   └── export_loans.py
│       ├── models
│       │   └── loan.model.js
│       └── routes
│           └── loan.routes.js
├── service-livres
│   ├── Dockerfile
│   ├── package.json
│   └── src
│       ├── app.js
│       ├── controllers
│       │   └── book.controller.js
│       ├── models
│       │   └── book.model.js
│       └── routes
│           └── book.routes.js
├── service-recommandation
│   ├── api
│   │   ├── routes.py
│   │   └── schemas.py
│   ├── Dockerfile
│   ├── main.py
│   ├── ml
│   │   └── recommender.py
│   └── requirements.txt
└── service-utilisateurs
    ├── Dockerfile
    ├── package.json
    └── src
        ├── app.js
        ├── controllers
        │   └── user.controller.js
        ├── models
        │   └── user.model.js
        └── routes
            └── user.routes.js

32 directories, 45 files

Voici les points clés à retenir sur cette structure :
Un dossier par microservice — chaque service (service-livres/, service-utilisateurs/, etc.) est totalement autonome avec son propre Dockerfile, son code source et sa config. C'est ce qui permet à Docker Compose de les orchestrer indépendamment.
dvc-pipeline/ regroupe les trois scripts Python (preprocess.py, train.py, evaluate.py) ainsi que les sous-dossiers data/ et models/. Les fichiers .dvc (ex: loans.csv.dvc) sont des pointeurs légers versionnés par Git — le vrai contenu binaire est sur le remote (Google Drive/S3).
service-recommandation/ a un Dockerfile multi-stage (exigé par le sujet) et une séparation claire entre la partie API (api/) et la logique ML (ml/). Le fichier loader.py est responsable de charger la bonne version de model.pkl.
À la racine, les fichiers dvc.yaml, dvc.lock, docker-compose.yml et .gitignore sont les fichiers de configuration globaux du projet — ils doivent tous être commités sur GitHub.
database/init.sql contient le schéma SQL initial (tables livres, users, emprunts) qui est exécuté automatiquement au premier démarrage du conteneur PostgreSQL via Docker Compose.

###########################SQL####################################
Quelques points importants sur ce schéma :
La table notes est essentielle — c'est elle qui alimente le système de recommandation. Elle stocke la note (1 à 5) qu'un utilisateur attribue à un livre, avec une contrainte UNIQUE(utilisateur_id, livre_id) pour éviter les doublons.
Le trigger update_updated_at met à jour automatiquement le champ updated_at à chaque modification de ligne, sans que le service backend ait besoin de le gérer manuellement.
Les données de test incluent un INSERT aléatoire dans notes via CROSS JOIN + RANDOM(), ce qui simule un historique d'interactions utile pour entraîner le modèle dès le début.
Ce fichier sera monté dans le conteneur PostgreSQL via Docker Compose avec cette config :
yaml
volumes:
  - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
PostgreSQL exécute automatiquement tout fichier .sql placé dans /docker-entrypoint-initdb.d/ au premier démarrage.

###############################Service-utilisateurs########################
Le token JWT généré au login sera réutilisé par les autres services pour identifier l'utilisateur courant — notamment le Service Emprunts qui en aura besoin.
#############################service-emprunts###################################
Deux points importants dans ce service : la création d'un emprunt utilise une transaction PostgreSQL (BEGIN / COMMIT / ROLLBACK) pour garantir qu'on ne dépasse jamais le nombre d'exemplaires disponibles, même en cas de requêtes simultanées. Et le script export_loans.py est le pont entre la base de données et le pipeline DVC.
#############################service-recommandation#############################
Le flux complet est le suivant : le frontend appelle GET /api/recommendations/{user_id}, le modèle SVD prédit un score pour chaque livre non encore emprunté par l'utilisateur, et retourne le top-K trié par score décroissant. Si le modèle n'est pas encore chargé, l'API répond 503 avec un message explicite invitant à lancer POST /api/train.


# Bibliothèque Numérique DIT

## Lancement avec Docker Compose

```bash
# Mode développement (hot-reload)
docker-compose up --build

# Mode production
docker-compose -f docker-compose.yml up --build -d
```

## Initialisation de la base de données

La base est initialisée automatiquement au premier démarrage
via `database/init.sql`. Pour réinitialiser :

```bash
docker-compose down -v
docker-compose up --build
```

## Entraînement du modèle avec DVC

```bash
# Activer l'environnement
conda activate bibliotheque2

# Lancer le pipeline complet
dvc repro

# Afficher les métriques
dvc metrics show

# Comparer deux versions
dvc metrics diff v1.0
```

## Tests des endpoints

```bash
# Service Livres
curl http://localhost:3001/health
curl http://localhost:3001/api/livres
curl http://localhost:3001/api/livres/search?q=intelligence

# Service Utilisateurs
curl http://localhost:3002/health
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Diallo","prenom":"Mamadou","email":"test@dit.sn",
       "mot_de_passe":"password123","type_utilisateur":"etudiant"}'

# Service Emprunts
curl http://localhost:3003/health
curl http://localhost:3003/api/emprunts/stats

# Service Recommandation
curl http://localhost:3004/health
curl http://localhost:3004/api/recommendations/USER_ID
curl -X POST http://localhost:3004/api/train
```
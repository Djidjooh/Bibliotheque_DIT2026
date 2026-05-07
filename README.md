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



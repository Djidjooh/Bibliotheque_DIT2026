# API Endpoints — Bibliothèque Numérique DIT

> **Version du projet :** microservices Node.js + FastAPI · Mai 2026

## URLs de base

| Service               | URL de base             | Port |
|-----------------------|-------------------------|------|
| service-livres        | http://localhost:3001   | 3001 |
| service-utilisateurs  | http://localhost:3002   | 3002 |
| service-emprunts      | http://localhost:3003   | 3003 |
| service-recommandation| http://localhost:3004   | 3004 |

## Authentification

Les routes protégées requièrent un header JWT :

```
Authorization: Bearer <token>
```

Le token est obtenu via `POST /api/auth/login` (service-utilisateurs).

**Niveaux d'accès :**
- **Public** — aucun token requis
- **JWT** — token valide requis (`type_utilisateur` quelconque)
- **Admin** — token d'un compte `personnel` (gestionnaire)

---

## Service Livres — port 3001

### `GET /health`
Vérifie que le service est opérationnel.

**Accès :** Public

**Réponse 200**
```json
{ "status": "ok", "service": "livres" }
```

---

### `GET /api/livres`
Liste paginée de tous les livres.

**Accès :** Public

**Query params**

| Paramètre | Type   | Défaut | Description              |
|-----------|--------|--------|--------------------------|
| `page`    | entier | 1      | Numéro de page           |
| `limit`   | entier | 10     | Nombre de résultats      |

**Réponse 200**
```json
{
  "livres": [
    {
      "id": "uuid",
      "titre": "Clean Code",
      "auteur": "Robert C. Martin",
      "isbn": "978-0132350884",
      "categorie": "Génie Logiciel",
      "editeur": "Prentice Hall",
      "annee_publication": 2008,
      "nombre_exemplaires": 4,
      "exemplaires_disponibles": 3,
      "description": "...",
      "created_at": "2026-05-01T..."
    }
  ],
  "total": 150
}
```

---

### `GET /api/livres/search?q=<terme>`
Recherche par titre, auteur ou ISBN (insensible à la casse).

**Accès :** Public

**Query params**

| Paramètre | Type   | Description       |
|-----------|--------|-------------------|
| `q`       | chaîne | Terme de recherche |

**Réponse 200**
```json
{ "livres": [...] }
```

---

### `GET /api/livres/disponibles`
Liste uniquement les livres ayant au moins un exemplaire disponible.

**Accès :** Public

**Réponse 200**
```json
{ "livres": [...] }
```

---

### `GET /api/livres/:id`
Détail d'un livre.

**Accès :** Public

**Réponse 200** → objet livre complet
**Réponse 404** `{ "error": "Livre non trouvé" }`

---

### `POST /api/livres`
Crée un nouveau livre.

**Accès :** Admin

**Body (JSON)**
```json
{
  "titre": "Docker en pratique",
  "auteur": "Ian Miell",
  "isbn": "978-1617294808",
  "categorie": "DevOps",
  "editeur": "Manning",
  "annee_publication": 2019,
  "nombre_exemplaires": 2,
  "description": "Guide complet Docker"
}
```

Champs obligatoires : `titre`, `auteur`, `isbn`

**Réponse 201** → objet livre créé
**Réponse 400** → champ manquant ou invalide
**Réponse 409** → ISBN déjà existant

---

### `PUT /api/livres/:id`
Met à jour un livre (remplacement complet).

**Accès :** Admin

**Body** → même structure que POST

**Réponse 200** → livre mis à jour
**Réponse 404** → livre non trouvé

---

### `DELETE /api/livres/:id`
Supprime un livre.

**Accès :** Admin

**Réponse 204** (succès, sans body)
**Réponse 404** → livre non trouvé

---

### `GET /api/admin/livres/stats`
Statistiques complètes du catalogue : totaux, répartition par catégorie, stocks épuisés.

**Accès :** Admin

**Réponse 200**
```json
{
  "totaux": {
    "total_titres": "150",
    "total_exemplaires": "320",
    "total_disponibles": "285",
    "total_empruntes": "35"
  },
  "par_categorie": [
    {
      "categorie": "Machine Learning",
      "total_titres": "12",
      "total_exemplaires": "36",
      "disponibles": "28"
    }
  ],
  "stocks_epuises": [
    { "id": "uuid", "titre": "...", "auteur": "...", "categorie": "...", "nombre_exemplaires": 2, "exemplaires_disponibles": 0 }
  ],
  "nb_stocks_epuises": 3
}
```

---

### `POST /api/admin/livres/bulk`
Import en masse de livres (transaction ACID, maximum 100 livres).

**Accès :** Admin

**Body (JSON)** → tableau d'objets livres
```json
[
  { "titre": "...", "auteur": "...", "isbn": "...", "categorie": "...", "nombre_exemplaires": 2 },
  { "titre": "...", "auteur": "...", "isbn": "..." }
]
```

**Réponse 207** (multi-status)
```json
{
  "importes": 8,
  "erreurs": 2,
  "created": [ { "id": "uuid", "titre": "...", "isbn": "..." } ],
  "errors":  [ { "index": 3, "isbn": "978-...", "error": "ISBN déjà existant" } ]
}
```
**Réponse 400** → corps invalide ou tableau vide

---

## Service Utilisateurs — port 3002

### `GET /health`
**Accès :** Public

**Réponse 200**
```json
{ "status": "ok", "service": "utilisateurs" }
```

---

### `POST /api/auth/register`
Inscription d'un nouvel utilisateur.

**Accès :** Public

**Body (JSON)**
```json
{
  "nom": "Diallo",
  "prenom": "Mamadou",
  "email": "mamadou@dit.sn",
  "mot_de_passe": "motdepasse123",
  "type_utilisateur": "etudiant"
}
```

`type_utilisateur` : `etudiant` | `professeur` | `personnel`

**Réponse 201**
```json
{
  "id": "uuid",
  "nom": "Diallo",
  "prenom": "Mamadou",
  "email": "mamadou@dit.sn",
  "type_utilisateur": "etudiant",
  "model_id": "u042",
  "actif": true,
  "created_at": "2026-05-14T..."
}
```
**Réponse 400** → champ manquant
**Réponse 409** → email déjà utilisé

---

### `POST /api/auth/login`
Connexion et obtention du token JWT (validité 24h).

**Accès :** Public

**Body (JSON)**
```json
{
  "email": "mamadou@dit.sn",
  "mot_de_passe": "motdepasse123"
}
```

**Réponse 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "utilisateur": {
    "id": "uuid",
    "nom": "Diallo",
    "prenom": "Mamadou",
    "email": "mamadou@dit.sn",
    "type_utilisateur": "etudiant",
    "model_id": "u042"
  }
}
```
**Réponse 401** → identifiants incorrects
**Réponse 403** → compte désactivé

---

### `GET /api/utilisateurs/stats`
Répartition des utilisateurs par type.

**Accès :** Public

**Réponse 200**
```json
{
  "stats": [
    { "type_utilisateur": "etudiant",   "total": "80" },
    { "type_utilisateur": "professeur", "total": "20" },
    { "type_utilisateur": "personnel",  "total": "10" }
  ]
}
```

---

### `GET /api/utilisateurs`
Liste paginée des utilisateurs (sans mots de passe).

**Accès :** JWT

**Query params**

| Paramètre | Type   | Défaut | Description                              |
|-----------|--------|--------|------------------------------------------|
| `page`    | entier | 1      | Numéro de page                           |
| `limit`   | entier | 10     | Nombre de résultats                      |
| `type`    | chaîne | —      | Filtre : `etudiant`, `professeur`, `personnel` |

**Réponse 200**
```json
{
  "utilisateurs": [
    {
      "id": "uuid",
      "nom": "Diallo",
      "prenom": "Mamadou",
      "email": "mamadou1@dit.sn",
      "type_utilisateur": "etudiant",
      "model_id": "u001",
      "actif": true,
      "created_at": "2026-05-01T..."
    }
  ],
  "total": 110
}
```

---

### `GET /api/utilisateurs/:id`
Détail d'un utilisateur.

**Accès :** JWT

**Réponse 200** → objet utilisateur (sans mot de passe)
**Réponse 404** → utilisateur non trouvé

---

### `PUT /api/utilisateurs/:id`
Mise à jour des informations d'un utilisateur.

**Accès :** JWT

**Body (JSON)**
```json
{
  "nom": "Diallo",
  "prenom": "Ibrahima",
  "email": "ibrahima@dit.sn",
  "type_utilisateur": "professeur"
}
```

Tous les champs sont obligatoires. Le mot de passe n'est pas modifiable via cette route.

**Réponse 200** → utilisateur mis à jour
**Réponse 400** → validation échouée
**Réponse 404** → utilisateur non trouvé

---

### `PATCH /api/utilisateurs/:id/toggle`
Bascule le statut actif/inactif d'un compte.

**Accès :** JWT

**Réponse 200**
```json
{
  "id": "uuid",
  "nom": "Diallo",
  "prenom": "Mamadou",
  "email": "mamadou@dit.sn",
  "actif": false
}
```
**Réponse 404** → utilisateur non trouvé

---

### `DELETE /api/utilisateurs/:id`
Supprime définitivement un utilisateur.

**Accès :** JWT

**Réponse 204** (succès, sans body)
**Réponse 404** → utilisateur non trouvé

---

### `GET /api/admin/utilisateurs/search`
Recherche avancée d'utilisateurs avec filtres combinables.

**Accès :** Admin

**Query params**

| Paramètre | Type    | Description                                      |
|-----------|---------|--------------------------------------------------|
| `q`       | chaîne  | Recherche dans nom, prénom, email (ILIKE)        |
| `type`    | chaîne  | Filtre par `type_utilisateur`                    |
| `actif`   | booléen | `true` ou `false`                                |
| `page`    | entier  | Numéro de page (défaut 1)                        |
| `limit`   | entier  | Résultats par page (défaut 20)                   |

**Réponse 200**
```json
{ "utilisateurs": [...], "total": 5 }
```

---

### `GET /api/admin/utilisateurs/inactifs`
Liste tous les comptes désactivés.

**Accès :** Admin

**Réponse 200**
```json
{
  "utilisateurs": [
    { "id": "uuid", "nom": "...", "prenom": "...", "email": "...", "type_utilisateur": "...", "created_at": "..." }
  ],
  "total": 2
}
```

---

### `GET /api/admin/utilisateurs/stats`
Statistiques globales des utilisateurs.

**Accès :** Admin

**Réponse 200**
```json
{
  "activite": {
    "total_utilisateurs": "110",
    "actifs": "108",
    "inactifs": "2",
    "nouveaux_30j": "5"
  },
  "par_type": [
    { "type_utilisateur": "etudiant",   "total": "80", "actifs": "79" },
    { "type_utilisateur": "professeur", "total": "20", "actifs": "20" },
    { "type_utilisateur": "personnel",  "total": "10", "actifs": "9"  }
  ]
}
```

---

### `PATCH /api/admin/utilisateurs/:id/reset-password`
Réinitialise le mot de passe d'un utilisateur.

**Accès :** Admin

**Body (JSON)**
```json
{ "nouveau_mot_de_passe": "nouveauMotDePasse2026" }
```

Longueur minimale : 6 caractères.

**Réponse 200**
```json
{
  "message": "Mot de passe réinitialisé",
  "utilisateur": { "id": "uuid", "nom": "...", "prenom": "...", "email": "..." }
}
```
**Réponse 400** → mot de passe trop court
**Réponse 404** → utilisateur non trouvé

---

### `PATCH /api/admin/utilisateurs/toggle-bulk`
Active ou désactive plusieurs comptes en une seule requête.

**Accès :** Admin

**Body (JSON)**
```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"],
  "actif": false
}
```

**Réponse 200**
```json
{
  "message": "3 utilisateur(s) désactivé(s)",
  "utilisateurs": [
    { "id": "uuid", "nom": "...", "prenom": "...", "email": "...", "actif": false }
  ]
}
```
**Réponse 400** → `ids` vide ou `actif` absent

---

## Service Emprunts — port 3003

### `GET /health`
**Accès :** Public

**Réponse 200**
```json
{ "status": "ok", "service": "emprunts" }
```

---

### `GET /api/emprunts`
Liste paginée des emprunts avec filtres optionnels.

**Accès :** Public

**Query params**

| Paramètre        | Type   | Description                                     |
|------------------|--------|-------------------------------------------------|
| `page`           | entier | Numéro de page (défaut 1)                       |
| `limit`          | entier | Résultats par page (défaut 10)                  |
| `statut`         | chaîne | `en_cours` \| `retourne` \| `en_retard`         |
| `utilisateur_id` | UUID   | Filtre par utilisateur                          |

**Réponse 200**
```json
{
  "emprunts": [
    {
      "id": "uuid",
      "utilisateur_id": "uuid",
      "livre_id": "uuid",
      "date_emprunt": "2026-04-14",
      "date_retour_prevue": "2026-05-14",
      "date_retour_effective": null,
      "statut": "en_cours",
      "nom": "Diallo",
      "prenom": "Mamadou",
      "titre": "Clean Code"
    }
  ],
  "total": 42
}
```

---

### `GET /api/emprunts/stats`
Statistiques globales des emprunts.

**Accès :** Public

**Réponse 200**
```json
{
  "en_cours": "12",
  "retournes": "55",
  "en_retard": "3",
  "total": "70"
}
```

---

### `GET /api/emprunts/penalites`
Liste des emprunts en retard avec calcul des pénalités (500 FCFA/jour).

**Accès :** Public

**Réponse 200**
```json
{
  "penalites": [
    {
      "id": "uuid",
      "utilisateur_id": "uuid",
      "livre_id": "uuid",
      "date_emprunt": "2026-03-01",
      "date_retour_prevue": "2026-03-31",
      "jours_retard": 14,
      "penalite_fcfa": 7000
    }
  ],
  "total": 3
}
```

---

### `GET /api/emprunts/export/csv`
Exporte les données d'emprunts au format CSV pour le pipeline ML/DVC.

**Accès :** Public

**Réponse 200** → fichier `loans.csv` (Content-Type: text/csv)

Colonnes : `user_id`, `book_id`, `categorie`, `statut`, `date_emprunt`, `date_retour_effective`, `rating`

---

### `GET /api/emprunts/utilisateur/:userId`
Historique des emprunts d'un utilisateur (retourne uniquement les champs de base).

**Accès :** Public

**Réponse 200**
```json
{ "emprunts": [...] }
```

---

### `GET /api/emprunts/:id`
Détail d'un emprunt.

**Accès :** Public

**Réponse 200** → objet emprunt complet
**Réponse 404** → emprunt non trouvé

---

### `POST /api/emprunts`
Crée un nouvel emprunt (transaction ACID).

**Accès :** Public

**Body (JSON)**
```json
{
  "utilisateur_id": "uuid",
  "livre_id": "uuid"
}
```

**Règles métier :**
- Durée d'emprunt : **30 jours** (configurable via `DUREE_EMPRUNT_JOURS`)
- Maximum **3 emprunts simultanés** par utilisateur
- Le livre doit avoir au moins 1 exemplaire disponible

**Réponse 201** → emprunt créé
**Réponse 409** → `"Aucun exemplaire disponible"` ou `"Limite de 3 emprunts simultanés atteinte"`

---

### `PATCH /api/emprunts/:id/retourner`
Marque un emprunt comme retourné et restitue l'exemplaire au stock.

**Accès :** Public *(action effectuée par le gestionnaire depuis l'interface)*

Fonctionne pour les statuts `en_cours` et `en_retard`.

**Réponse 200** → emprunt mis à jour avec `date_retour_effective`
**Réponse 404** → emprunt introuvable ou déjà retourné

---

### `POST /api/emprunts/detecter-retards`
Détecte les emprunts dont la date de retour prévue est dépassée et met leur statut à `en_retard`.

**Accès :** Public

**Réponse 200**
```json
{
  "message": "3 emprunt(s) mis en retard",
  "retards": [...]
}
```

---

### `GET /api/admin/dashboard`
Tableau de bord administrateur complet.

**Accès :** Admin

**Réponse 200**
```json
{
  "global": {
    "total_utilisateurs": "110",
    "utilisateurs_actifs": "108",
    "total_titres": "150",
    "total_exemplaires": "320",
    "exemplaires_disponibles": "285",
    "emprunts_en_cours": "12",
    "emprunts_en_retard": "3",
    "emprunts_retournes": "55",
    "total_emprunts": "70",
    "total_penalites_fcfa": "10500"
  },
  "top_livres": [
    { "titre": "Clean Code", "auteur": "...", "categorie": "...", "nb_emprunts": "8", "exemplaires_disponibles": 2 }
  ],
  "top_utilisateurs": [
    { "nom": "Diallo", "prenom": "Mamadou", "email": "...", "type_utilisateur": "etudiant",
      "nb_emprunts": "5", "en_cours": "2", "en_retard": "0", "penalites_fcfa": "0" }
  ],
  "emprunts_par_mois": [
    { "mois": "2026-01", "total": "18", "retournes": "15", "en_cours": "3" }
  ],
  "echeances_proches": [
    { "id": "uuid", "date_retour_prevue": "2026-05-16", "nom": "...", "prenom": "...", "email": "...", "titre": "...", "isbn": "..." }
  ]
}
```

---

### `GET /api/admin/retards`
Liste complète des emprunts en retard avec pénalités calculées.

**Accès :** Admin

**Réponse 200**
```json
{
  "retards": [
    {
      "id": "uuid",
      "date_emprunt": "2026-03-01",
      "date_retour_prevue": "2026-03-31",
      "jours_retard": 14,
      "penalite_fcfa": 7000,
      "utilisateur_id": "uuid",
      "nom": "Sow", "prenom": "Ndeye", "email": "ndeye14@dit.sn",
      "type_utilisateur": "etudiant",
      "livre_id": "uuid",
      "titre": "Deep Learning", "auteur": "...", "isbn": "...", "categorie": "..."
    }
  ],
  "total": 3,
  "total_penalites_fcfa": 21000
}
```

---

### `PATCH /api/admin/emprunts/:id/forcer-retour`
Force le retour d'un emprunt (même en retard). Action tracée avec l'ID admin.

**Accès :** Admin

**Réponse 200**
```json
{
  "message": "Retour forcé par administrateur",
  "emprunt": { ... },
  "admin_id": "uuid"
}
```
**Réponse 404** → emprunt introuvable ou déjà retourné

---

### `PATCH /api/admin/emprunts/:id/prolonger`
Prolonge la date de retour prévue d'un emprunt. Si l'emprunt était `en_retard`, il repasse à `en_cours`.

**Accès :** Admin

**Body (JSON)**
```json
{ "jours": 14 }
```

`jours` : entre 1 et 60 (défaut : valeur de `DUREE_EMPRUNT_JOURS`)

**Réponse 200**
```json
{
  "message": "Emprunt prolongé de 14 jour(s)",
  "emprunt": { ... }
}
```
**Réponse 400** → nombre de jours hors limite
**Réponse 404** → emprunt introuvable ou déjà retourné

---

### `GET /api/admin/emprunts/utilisateur/:userId`
Historique complet et enrichi d'un utilisateur : durées, retards, pénalités, notes.

**Accès :** Admin

**Réponse 200**
```json
{
  "historique": [
    {
      "id": "uuid",
      "date_emprunt": "2026-03-01",
      "date_retour_prevue": "2026-03-31",
      "date_retour_effective": "2026-03-28",
      "statut": "retourne",
      "duree_jours": 27,
      "jours_retard": 0,
      "penalite_fcfa": 0,
      "titre": "Clean Code",
      "auteur": "Robert C. Martin",
      "isbn": "978-0132350884",
      "categorie": "Génie Logiciel",
      "note_donnee": 4.5
    }
  ],
  "stats": {
    "total": 5,
    "retournes": 4,
    "en_cours": 1,
    "en_retard": 0,
    "total_penalites_fcfa": 0
  }
}
```

---

## Service Recommandation — port 3004

### `GET /health`
**Accès :** Public

**Réponse 200**
```json
{
  "status": "ok",
  "service": "recommandation",
  "model_loaded": true
}
```

---

### `GET /api/recommendations/{user_id}?top_k=5`
Recommandations personnalisées pour un utilisateur.

**Accès :** Public

**Path param :** `user_id` — UUID PostgreSQL **ou** `model_id` (ex: `u001`)
**Query param :** `top_k` — entre 1 et 20 (défaut 5)

**Comportement :**
| Situation | Réponse |
|---|---|
| Utilisateur dans le modèle SVD | Recommandations par filtrage collaboratif |
| ≥ 5 emprunts mais hors modèle | Fallback : livres populaires dans ses catégories préférées |
| < 5 emprunts | Erreur 404 avec message d'encouragement |

**Réponse 200**
```json
{
  "user_id": "uuid-ou-u001",
  "model_id": "u001",
  "recommandations": [
    {
      "book_id": "b003",
      "model_id": "b003",
      "score": 4.521,
      "titre": "Deep Learning",
      "auteur": "Goodfellow et al.",
      "categorie": "Deep Learning",
      "annee_publication": 2016,
      "exemplaires_disponibles": 2
    }
  ],
  "total": 5
}
```
**Réponse 404** → utilisateur inconnu ou historique insuffisant
**Réponse 503** → modèle non chargé (lancer d'abord `POST /api/train`)

---

### `POST /api/train`
Ré-entraîne le modèle SVD à partir des données DVC.

**Accès :** Public

**Body (JSON)** — tous les champs sont optionnels
```json
{
  "n_factors": 50,
  "n_epochs": 20,
  "lr_all": 0.005,
  "reg_all": 0.02
}
```

**Réponse 200**
```json
{
  "message": "Entraînement terminé avec succès",
  "rmse": 1.3793,
  "mae": 1.2747,
  "n_users": 110,
  "n_items": 150
}
```
**Réponse 404** → fichier de données introuvable (exécuter `dvc repro` d'abord)
**Réponse 500** → erreur d'entraînement

---

### `GET /api/model/info`
Informations sur le modèle SVD actuellement en mémoire.

**Accès :** Public

**Réponse 200**
```json
{
  "model_path": "models/model.pkl",
  "loaded_at": "2026-05-14T10:00:00.000000",
  "algo": "SVD"
}
```
**Réponse 503** → modèle non chargé

---

## Codes d'erreur communs

| Code | Signification                                    |
|------|--------------------------------------------------|
| 400  | Données invalides ou manquantes                  |
| 401  | Identifiants incorrects / token manquant         |
| 403  | Compte désactivé / droits insuffisants           |
| 404  | Ressource introuvable                            |
| 409  | Conflit (doublon ISBN, email, limite emprunts…)  |
| 500  | Erreur interne du serveur                        |
| 503  | Service temporairement indisponible              |

---

## Comptes de test

| Rôle                  | Email                | Mot de passe |
|-----------------------|----------------------|--------------|
| Gestionnaire (Admin)  | `admin@dit.sn`       | `admin2026`  |
| Étudiant              | `mamadou1@dit.sn`    | `dit2026`    |
| Professeur            | `ibrahima3@dit.sn`   | `dit2026`    |
| Personnel             | `aminata4@dit.sn`    | `dit2026`    |

> Tous les comptes seed utilisent le mot de passe par défaut `dit2026`.

# API Endpoints — Bibliothèque Numérique DIT

Base URLs par service :

| Service              | URL de base              |
|----------------------|--------------------------|
| service-livres       | http://localhost:3001    |
| service-utilisateurs | http://localhost:3002    |
| service-emprunts     | http://localhost:3003    |
| service-recommandation | http://localhost:3004  |

---

## Service Livres (port 3001)

### `GET /health`
Vérifie que le service est opérationnel.

**Réponse 200**
```json
{ "status": "ok", "service": "livres" }
```

---

### `GET /api/livres`
Liste paginée de tous les livres.

**Query params** : `page` (défaut 1), `limit` (défaut 10)

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
      "exemplaires_disponibles": 4
    }
  ],
  "total": 5
}
```

---

### `GET /api/livres/search?q=<terme>`
Recherche par titre, auteur ou ISBN (insensible à la casse).

**Réponse 200**
```json
{ "livres": [...] }
```

---

### `GET /api/livres/disponibles`
Liste uniquement les livres avec au moins un exemplaire disponible.

**Réponse 200**
```json
{ "livres": [...] }
```

---

### `GET /api/livres/:id`
Détail d'un livre.

**Réponse 200** → objet livre  
**Réponse 404** `{ "error": "Livre non trouvé" }`

---

### `POST /api/livres`
Crée un nouveau livre.

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
**Réponse 400** → erreur de validation  
**Réponse 409** → ISBN déjà existant

---

### `PUT /api/livres/:id`
Met à jour un livre existant (remplacement complet).

**Body** → même structure que POST

**Réponse 200** → livre mis à jour  
**Réponse 404** → livre non trouvé

---

### `DELETE /api/livres/:id`
Supprime un livre.

**Réponse 204** (succès, pas de body)  
**Réponse 404** → livre non trouvé

---

## Service Utilisateurs (port 3002)

### `GET /health`
```json
{ "status": "ok", "service": "utilisateurs" }
```

---

### `POST /api/auth/register`
Inscription d'un nouvel utilisateur.

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
  "actif": true,
  "created_at": "2026-05-08T..."
}
```
**Réponse 409** → email déjà utilisé

---

### `POST /api/auth/login`
Connexion et obtention du JWT.

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
    "type_utilisateur": "etudiant"
  }
}
```
**Réponse 401** → identifiants incorrects  
**Réponse 403** → compte désactivé

---

### `GET /api/utilisateurs`
Liste paginée des utilisateurs (sans mots de passe).

**Query params** : `page`, `limit`, `type` (filtre par type_utilisateur)

**Réponse 200**
```json
{ "utilisateurs": [...], "total": 4 }
```

---

### `GET /api/utilisateurs/:id`
Détail d'un utilisateur.

**Réponse 200** → objet utilisateur  
**Réponse 404** → non trouvé

---

### `PUT /api/utilisateurs/:id`
Mise à jour des informations d'un utilisateur.

---

### `PATCH /api/utilisateurs/:id/toggle`
Active ou désactive un compte utilisateur.

---

### `DELETE /api/utilisateurs/:id`
Supprime un utilisateur.

---

## Service Emprunts (port 3003)

### `GET /health`
```json
{ "status": "ok", "service": "emprunts" }
```

---

### `GET /api/emprunts`
Liste paginée avec filtres optionnels.

**Query params** : `page`, `limit`, `statut` (`en_cours`|`retourne`|`en_retard`), `utilisateur_id`

**Réponse 200**
```json
{
  "emprunts": [
    {
      "id": "uuid",
      "utilisateur_id": "uuid",
      "livre_id": "uuid",
      "date_emprunt": "2026-05-08",
      "date_retour_prevue": "2026-05-22",
      "date_retour_effective": null,
      "statut": "en_cours",
      "nom": "Diallo",
      "prenom": "Mamadou",
      "titre": "Clean Code"
    }
  ],
  "total": 1
}
```

---

### `GET /api/emprunts/stats`
Statistiques globales des emprunts.

**Réponse 200**
```json
{
  "en_cours": "2",
  "retournes": "5",
  "en_retard": "1",
  "total": "8"
}
```

---

### `GET /api/emprunts/export/csv`
Exporte les données d'emprunts au format CSV pour le pipeline ML/DVC.

**Réponse 200** → fichier `loans.csv` (Content-Type: text/csv)

Colonnes : `user_id`, `book_id`, `categorie`, `statut`, `date_emprunt`, `date_retour_effective`, `rating`

---

### `GET /api/emprunts/utilisateur/:userId`
Historique complet d'un utilisateur.

**Réponse 200**
```json
{ "emprunts": [...] }
```

---

### `GET /api/emprunts/:id`
Détail d'un emprunt.

---

### `POST /api/emprunts`
Crée un nouvel emprunt (transaction ACID).

**Body (JSON)**
```json
{
  "utilisateur_id": "uuid",
  "livre_id": "uuid"
}
```

Durée d'emprunt par défaut : 14 jours (configurable via `DUREE_EMPRUNT_JOURS`)

**Réponse 201** → emprunt créé  
**Réponse 409** → `Aucun exemplaire disponible` ou `Livre déjà emprunté par cet utilisateur`

---

### `PATCH /api/emprunts/:id/retourner`
Marque un emprunt comme retourné (fonctionne pour statuts `en_cours` et `en_retard`).

**Réponse 200** → emprunt mis à jour  
**Réponse 404** → emprunt introuvable ou déjà retourné

---

### `POST /api/emprunts/detecter-retards`
Détecte et met à jour les emprunts dont la date de retour prévue est dépassée.

**Réponse 200**
```json
{ "message": "3 emprunt(s) mis en retard", "retards": [...] }
```

---

## Service Recommandation (port 3004)

### `GET /health`
```json
{
  "status": "ok",
  "service": "recommandation",
  "model_loaded": true
}
```

---

### `GET /api/model/info`
Informations sur le modèle SVD actuellement chargé.

**Réponse 200**
```json
{
  "model_path": "models/model.pkl",
  "loaded_at": "2026-05-08T10:00:00.000000",
  "algo": "SVD"
}
```
**Réponse 503** → modèle non chargé

---

### `GET /api/recommendations/{user_id}?top_k=5`
Recommandations personnalisées pour un utilisateur.

**Path param** : `user_id` — identifiant utilisateur tel qu'encodé dans le modèle  
**Query param** : `top_k` (1–20, défaut 5)

**Réponse 200**
```json
{
  "user_id": "u001",
  "recommandations": [
    { "book_id": "b003", "score": 4.521 },
    { "book_id": "b007", "score": 4.312 }
  ],
  "total": 2
}
```
**Réponse 404** → utilisateur inconnu du modèle  
**Réponse 503** → modèle non chargé (lancer d'abord `POST /api/train`)

---

### `POST /api/train`
Ré-entraîne le modèle SVD à partir des données DVC.

**Body (JSON — tous les champs optionnels)**
```json
{
  "n_factors": 100,
  "n_epochs": 30,
  "lr_all": 0.01,
  "reg_all": 0.02
}
```

**Réponse 200**
```json
{
  "message": "Entraînement terminé avec succès",
  "rmse": 1.3793,
  "mae": 1.2747,
  "n_users": 4,
  "n_items": 5
}
```
**Réponse 404** → fichier de données introuvable (exécuter `dvc repro` d'abord)  
**Réponse 500** → erreur d'entraînement

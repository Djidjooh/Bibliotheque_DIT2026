import os
import psycopg2
import psycopg2.extras

MIN_EMPRUNTS_RECO = 5  # nombre minimum d'emprunts pour activer les recommandations

def get_conn():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "bibliotheque"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )

def resolve_user_model_id(user_id: str) -> str:
    """Retourne le model_id pour un UUID ou model_id déjà valide."""
    if user_id.startswith("u") and len(user_id) <= 6:
        return user_id
    try:
        conn = get_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT model_id FROM utilisateurs WHERE id = %s OR model_id = %s",
                (user_id, user_id)
            )
            row = cur.fetchone()
        conn.close()
        if not row or not row["model_id"]:
            raise ValueError(f"Utilisateur inconnu : {user_id}")
        return row["model_id"]
    except psycopg2.Error as e:
        raise ValueError(f"Erreur base de données : {e}")

def get_books_by_model_ids(model_ids: list) -> dict:
    """Retourne un dict {model_id: {titre, auteur, categorie, ...}}."""
    if not model_ids:
        return {}
    try:
        conn = get_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT model_id, titre, auteur, categorie,
                       annee_publication, exemplaires_disponibles
                FROM livres
                WHERE model_id = ANY(%s)
                """,
                (model_ids,)
            )
            rows = cur.fetchall()
        conn.close()
        return {r["model_id"]: dict(r) for r in rows}
    except psycopg2.Error:
        return {}

def count_user_loans(user_id: str) -> int:
    """Retourne le nombre total d'emprunts (terminés ou en cours) d'un utilisateur (UUID ou model_id)."""
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            # Résoudre UUID ou model_id
            cur.execute(
                "SELECT id FROM utilisateurs WHERE id = %s OR model_id = %s",
                (user_id, user_id)
            )
            row = cur.fetchone()
            if not row:
                conn.close()
                return 0
            uid = row[0]
            cur.execute(
                "SELECT COUNT(*) FROM emprunts WHERE utilisateur_id = %s",
                (uid,)
            )
            count = cur.fetchone()[0]
        conn.close()
        return int(count)
    except psycopg2.Error:
        return 0

def get_fallback_recommendations(user_id: str, top_k: int = 5) -> list:
    """
    Recommandations basées sur l'historique réel de l'utilisateur :
    - Priorité aux livres des catégories les plus empruntées
    - Exclut les livres déjà empruntés
    - Trie par popularité globale dans ces catégories
    """
    try:
        conn = get_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Résoudre UUID ou model_id → UUID interne
            cur.execute(
                "SELECT id FROM utilisateurs WHERE id = %s OR model_id = %s",
                (user_id, user_id)
            )
            row = cur.fetchone()
            if not row:
                conn.close()
                return []
            uid = str(row["id"])

            # Catégories préférées de l'utilisateur (par fréquence), max 5
            cur.execute(
                """
                SELECT l.categorie
                FROM emprunts e
                JOIN livres l ON l.id = e.livre_id
                WHERE e.utilisateur_id = %s AND l.categorie IS NOT NULL
                GROUP BY l.categorie
                ORDER BY COUNT(*) DESC
                LIMIT 5
                """,
                (uid,)
            )
            fav_categories = [r["categorie"] for r in cur.fetchall()]

            if not fav_categories:
                conn.close()
                return []

            # Construire les placeholders pour les catégories
            cat_placeholders = ",".join(["%s"] * len(fav_categories))

            # Livres populaires dans ces catégories, non encore empruntés par l'utilisateur
            cur.execute(
                f"""
                SELECT l.model_id, l.titre, l.auteur, l.categorie,
                       l.annee_publication, l.exemplaires_disponibles,
                       COUNT(e2.id) AS nb_emprunts
                FROM livres l
                LEFT JOIN emprunts e2 ON e2.livre_id = l.id
                WHERE l.categorie IN ({cat_placeholders})
                  AND l.exemplaires_disponibles > 0
                  AND l.id NOT IN (
                      SELECT livre_id FROM emprunts WHERE utilisateur_id = %s
                  )
                GROUP BY l.id, l.model_id, l.titre, l.auteur, l.categorie,
                         l.annee_publication, l.exemplaires_disponibles
                ORDER BY nb_emprunts DESC
                LIMIT %s
                """,
                fav_categories + [uid, top_k]
            )
            books = cur.fetchall()
        conn.close()

        result = []
        for b in books:
            result.append({
                "book_id":                b["model_id"] or "",
                "model_id":               b["model_id"] or "",
                "score":                  round(3.5 + (int(b["nb_emprunts"]) * 0.05), 3),
                "titre":                  b["titre"],
                "auteur":                 b["auteur"],
                "categorie":              b["categorie"],
                "annee_publication":      b["annee_publication"],
                "exemplaires_disponibles":b["exemplaires_disponibles"],
            })
        return result
    except Exception:
        return []

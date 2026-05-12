import os
import psycopg2
import psycopg2.extras

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

import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", 5432),
    dbname=os.getenv("DB_NAME", "bibliotheque"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", "postgres"),
)

query = """
    SELECT
        e.utilisateur_id  AS user_id,
        e.livre_id        AS book_id,
        l.categorie,
        e.statut,
        e.date_emprunt,
        COALESCE(n.note, 0) AS rating
    FROM emprunts e
    JOIN livres l ON l.id = e.livre_id
    LEFT JOIN notes n
        ON n.utilisateur_id = e.utilisateur_id
       AND n.livre_id = e.livre_id
    ORDER BY e.date_emprunt
"""

df = pd.read_sql(query, conn)
conn.close()

os.makedirs("dvc-pipeline/data", exist_ok=True)
df.to_csv("dvc-pipeline/data/loans.csv", index=False)

print(f"Export terminé : {len(df)} lignes → dvc-pipeline/data/loans.csv")

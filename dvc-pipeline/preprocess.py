import os
import pandas as pd
import numpy as np
from dotenv import load_dotenv

load_dotenv()

INPUT_PATH  = "dvc-pipeline/data/loans.csv"
OUTPUT_PATH = "dvc-pipeline/data/loans_clean.csv"


def load_data(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Fichier introuvable : {path}\n"
            "Exécutez d'abord : python service-emprunts/src/export/export_loans.py"
        )
    df = pd.read_csv(path)
    print(f"[preprocess] Données chargées : {len(df)} lignes, {df.shape[1]} colonnes")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    initial = len(df)

    # 1. Supprimer les doublons
    df = df.drop_duplicates(subset=["user_id", "book_id", "date_emprunt"])
    print(f"[preprocess] Doublons supprimés : {initial - len(df)}")

    # 2. Supprimer les lignes avec user_id ou book_id manquants
    df = df.dropna(subset=["user_id", "book_id"])

    # 3. Normaliser la colonne rating
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(0)
    df["rating"] = df["rating"].clip(0, 5)

    # 4. Générer un rating implicite si rating == 0
    #    (emprunt sans note → rating implicite basé sur le statut)
    def implicit_rating(row):
        if row["rating"] > 0:
            return row["rating"]
        if row["statut"] == "retourne":
            return 3.0   # retour normal → note neutre
        if row["statut"] == "en_retard":
            return 2.0   # retard → légèrement négatif
        return 2.5        # en cours → neutre

    df["rating"] = df.apply(implicit_rating, axis=1)

    # 5. Convertir les dates
    df["date_emprunt"] = pd.to_datetime(df["date_emprunt"], errors="coerce")

    # 6. Supprimer les lignes avec des dates invalides
    df = df.dropna(subset=["date_emprunt"])

    # 7. Encoder la catégorie
    df["categorie"] = df["categorie"].fillna("Inconnu").str.strip()

    # 8. Ajouter feature : nombre d'emprunts par utilisateur
    user_counts = df.groupby("user_id")["book_id"].count().rename("user_loan_count")
    df = df.merge(user_counts, on="user_id", how="left")

    # 9. Filtrer les utilisateurs avec moins de 2 interactions
    df = df[df["user_loan_count"] >= 2]

    print(f"[preprocess] Lignes après nettoyage : {len(df)}")
    return df


def save_data(df: pd.DataFrame, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    print(f"[preprocess] Données sauvegardées → {path}")


if __name__ == "__main__":
    df = load_data(INPUT_PATH)
    df = clean_data(df)
    save_data(df, OUTPUT_PATH)

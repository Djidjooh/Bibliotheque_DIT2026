import os
import joblib
import pandas as pd
from surprise import Dataset, Reader, SVD, accuracy
from surprise.model_selection import train_test_split

MODEL_PATH = os.getenv("MODEL_PATH", "models/model.pkl")
DATA_PATH  = os.getenv("DATA_PATH",  "dvc-pipeline/data/loans_clean.csv")


class Recommender:

    @staticmethod
    def train(n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02):
        if not os.path.exists(DATA_PATH):
            raise FileNotFoundError(
                f"Données introuvables : {DATA_PATH}. "
                "Exécutez d'abord dvc repro."
            )

        # Chargement des données
        df = pd.read_csv(DATA_PATH)

        # Ne garder que les lignes avec une note réelle
        df = df[df["rating"] > 0]

        if df.empty:
            raise ValueError("Aucune donnée d'entraînement disponible.")

        reader  = Reader(rating_scale=(1, 5))
        data    = Dataset.load_from_df(df[["user_id", "book_id", "rating"]], reader)
        trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

        # Entraînement SVD
        algo = SVD(
            n_factors=n_factors,
            n_epochs=n_epochs,
            lr_all=lr_all,
            reg_all=reg_all,
            random_state=42,
        )
        algo.fit(trainset)

        # Évaluation
        predictions = algo.test(testset)
        rmse = accuracy.rmse(predictions, verbose=False)
        mae  = accuracy.mae(predictions,  verbose=False)

        # Sauvegarde du modèle
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(algo, MODEL_PATH)
        print(f"[Recommender] Modèle sauvegardé → {MODEL_PATH}")

        return {
            "message": "Entraînement terminé avec succès",
            "rmse":    round(rmse, 4),
            "mae":     round(mae,  4),
            "n_users": trainset.n_users,
            "n_items": trainset.n_items,
        }

    @staticmethod
    def recommend(model, user_id: str, top_k: int = 5):
        # Récupérer tous les livres connus du modèle
        trainset   = model.trainset
        all_items  = [trainset.to_raw_iid(i) for i in trainset.all_items()]

        # Livres déjà vus par l'utilisateur
        try:
            inner_uid  = trainset.to_inner_uid(user_id)
            seen_items = set(
                trainset.to_raw_iid(iid)
                for iid, _ in trainset.ur[inner_uid]
            )
        except ValueError:
            raise ValueError(f"Utilisateur inconnu du modèle : {user_id}")

        # Prédire sur les livres non encore vus
        unseen = [iid for iid in all_items if iid not in seen_items]
        preds  = [
            {"book_id": iid, "score": round(model.predict(user_id, iid).est, 3)}
            for iid in unseen
        ]

        # Trier par score décroissant
        preds.sort(key=lambda x: x["score"], reverse=True)
        return preds[:top_k]

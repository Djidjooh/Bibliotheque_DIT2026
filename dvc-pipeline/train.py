import os
import joblib
import pandas as pd
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split, cross_validate

INPUT_PATH  = "dvc-pipeline/data/loans_clean.csv"
MODEL_PATH  = "dvc-pipeline/models/model.pkl"
PARAMS_PATH = "dvc-pipeline/params.yaml"


def load_params() -> dict:
    import yaml
    if os.path.exists(PARAMS_PATH):
        with open(PARAMS_PATH) as f:
            return yaml.safe_load(f).get("train", {})
    return {}


def train(params: dict):
    if not os.path.exists(INPUT_PATH):
        raise FileNotFoundError(f"Données introuvables : {INPUT_PATH}")

    df = pd.read_csv(INPUT_PATH)
    df = df[df["rating"] > 0][["user_id", "book_id", "rating"]]

    print(f"[train] {len(df)} interactions | "
          f"{df['user_id'].nunique()} utilisateurs | "
          f"{df['book_id'].nunique()} livres")

    reader   = Reader(rating_scale=(1, 5))
    data     = Dataset.load_from_df(df, reader)
    trainset, _ = train_test_split(data, test_size=0.2, random_state=42)

    algo = SVD(
        n_factors=params.get("n_factors", 50),
        n_epochs=params.get("n_epochs",   20),
        lr_all=params.get("lr_all",       0.005),
        reg_all=params.get("reg_all",     0.02),
        random_state=42,
        verbose=True,
    )

    algo.fit(trainset)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(algo, MODEL_PATH)
    print(f"[train] Modèle sauvegardé → {MODEL_PATH}")

    return algo


if __name__ == "__main__":
    params = load_params()
    train(params)

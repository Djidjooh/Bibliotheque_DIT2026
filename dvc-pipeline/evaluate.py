import os
import json
import joblib
import pandas as pd
from collections import defaultdict
from surprise import Dataset, Reader, accuracy
from surprise.model_selection import train_test_split

MODEL_PATH   = "dvc-pipeline/models/model.pkl"
DATA_PATH    = "dvc-pipeline/data/loans_clean.csv"
METRICS_PATH = "metrics/metrics.json"


def precision_recall_at_k(predictions, k=10, threshold=3.5):
    user_est_true = defaultdict(list)
    for uid, _, true_r, est, _ in predictions:
        user_est_true[uid].append((est, true_r))

    precisions, recalls = {}, {}
    for uid, user_ratings in user_est_true.items():
        user_ratings.sort(key=lambda x: x[0], reverse=True)
        n_rel           = sum(1 for (_, t) in user_ratings if t >= threshold)
        n_rec_k         = sum(1 for (e, _) in user_ratings[:k] if e >= threshold)
        n_rel_and_rec_k = sum(
            1 for (e, t) in user_ratings[:k]
            if t >= threshold and e >= threshold
        )
        precisions[uid] = n_rel_and_rec_k / k     if k else 0
        recalls[uid]    = n_rel_and_rec_k / n_rel if n_rel else 0

    p = sum(precisions.values()) / len(precisions) if precisions else 0
    r = sum(recalls.values())    / len(recalls)    if recalls    else 0
    return round(p, 4), round(r, 4)


def evaluate():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Modèle introuvable : {MODEL_PATH}")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Données introuvables : {DATA_PATH}")

    model = joblib.load(MODEL_PATH)
    df    = pd.read_csv(DATA_PATH)
    df    = df[df["rating"] > 0][["user_id", "book_id", "rating"]]

    reader   = Reader(rating_scale=(1, 5))
    data     = Dataset.load_from_df(df, reader)
    _, testset = train_test_split(data, test_size=0.2, random_state=42)

    predictions = model.test(testset)

    rmse = round(accuracy.rmse(predictions, verbose=False), 4)
    mae  = round(accuracy.mae(predictions,  verbose=False), 4)
    precision, recall = precision_recall_at_k(predictions, k=10, threshold=3.5)

    # F1 score
    f1 = round(
        2 * precision * recall / (precision + recall)
        if (precision + recall) > 0 else 0,
        4
    )

    metrics = {
        "rmse":         rmse,
        "mae":          mae,
        "precision@10": precision,
        "recall@10":    recall,
        "f1@10":        f1,
        "n_test":       len(predictions),
    }

    os.makedirs(os.path.dirname(METRICS_PATH), exist_ok=True)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print("[evaluate] Métriques :")
    for k, v in metrics.items():
        print(f"  {k:15s} → {v}")
    print(f"[evaluate] Sauvegardé → {METRICS_PATH}")

    return metrics


if __name__ == "__main__":
    evaluate()

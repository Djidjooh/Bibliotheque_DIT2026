from fastapi import APIRouter, HTTPException, Query
from api.schemas import RecommandationResponse, RecommandationItem, TrainRequest, TrainResponse
from api.db import resolve_user_model_id, get_books_by_model_ids
from ml.recommender import Recommender
from ml.loader import ModelLoader

router = APIRouter()


# GET /api/recommendations/{user_id}
# user_id peut être un UUID PostgreSQL ou un model_id (u001, u002...)
@router.get("/recommendations/{user_id}", response_model=RecommandationResponse)
def get_recommendations(
    user_id: str,
    top_k: int = Query(default=5, ge=1, le=20)
):
    if ModelLoader.model is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé.")

    # 1. Résoudre l'UUID → model_id
    try:
        model_uid = resolve_user_model_id(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # 2. Obtenir les recommandations SVD (retourne des model_id livres)
    try:
        preds = Recommender.recommend(
            model=ModelLoader.model,
            user_id=model_uid,
            top_k=top_k,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # 3. Enrichir avec les détails des livres depuis la BD
    book_model_ids = [p["book_id"] for p in preds]
    book_details   = get_books_by_model_ids(book_model_ids)

    items = []
    for p in preds:
        info = book_details.get(p["book_id"], {})
        items.append(RecommandationItem(
            book_id=info.get("model_id", p["book_id"]),
            model_id=p["book_id"],
            score=p["score"],
            titre=info.get("titre"),
            auteur=info.get("auteur"),
            categorie=info.get("categorie"),
            annee_publication=info.get("annee_publication"),
            exemplaires_disponibles=info.get("exemplaires_disponibles"),
        ))

    return RecommandationResponse(
        user_id=user_id,
        model_id=model_uid,
        recommandations=items,
        total=len(items),
    )


# POST /api/train
@router.post("/train", response_model=TrainResponse)
def train_model(params: TrainRequest):
    try:
        result = Recommender.train(
            n_factors=params.n_factors,
            n_epochs=params.n_epochs,
            lr_all=params.lr_all,
            reg_all=params.reg_all,
        )
        ModelLoader.load()
        return TrainResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# GET /api/model/info
@router.get("/model/info")
def model_info():
    if ModelLoader.model is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé")
    return ModelLoader.get_info()

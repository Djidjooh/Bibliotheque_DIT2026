from fastapi import APIRouter, HTTPException, Query
from api.schemas import RecommandationResponse, TrainRequest, TrainResponse
from ml.recommender import Recommender
from ml.loader import ModelLoader

router = APIRouter()

# GET /api/recommendations/{user_id}
@router.get(
    "/recommendations/{user_id}",
    response_model=RecommandationResponse
)
def get_recommendations(
    user_id: str,
    top_k: int = Query(default=5, ge=1, le=20)
):
    if ModelLoader.model is None:
        raise HTTPException(
            status_code=503,
            detail="Modèle non chargé. Lancez d'abord POST /api/train"
        )
    try:
        recommandations = Recommender.recommend(
            model=ModelLoader.model,
            user_id=user_id,
            top_k=top_k
        )
        return RecommandationResponse(
            user_id=user_id,
            recommandations=recommandations,
            total=len(recommandations)
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

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
        ModelLoader.load()  # Recharger le nouveau modèle en mémoire
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

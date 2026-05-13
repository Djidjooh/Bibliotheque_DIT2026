from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api.routes import router
from ml.loader import ModelLoader

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Chargement du modèle au démarrage
    ModelLoader.load()
    yield
    # Nettoyage à l'arrêt
    ModelLoader.model = None

app = FastAPI(
    title="API Recommandation — Bibliothèque DIT",
    description="Système de recommandation de livres basé sur SVD",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "recommandation",
        "model_loaded": ModelLoader.model is not None,
    }

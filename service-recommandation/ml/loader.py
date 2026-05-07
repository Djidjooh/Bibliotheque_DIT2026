import os
import joblib
from datetime import datetime

class ModelLoader:
    model      = None
    loaded_at  = None
    model_path = None

    @classmethod
    def load(cls):
        path = os.getenv("MODEL_PATH", "models/model.pkl")
        if not os.path.exists(path):
            print(f"[ModelLoader] Modèle introuvable : {path}")
            return False
        cls.model      = joblib.load(path)
        cls.loaded_at  = datetime.now().isoformat()
        cls.model_path = path
        print(f"[ModelLoader] Modèle chargé depuis {path}")
        return True

    @classmethod
    def get_info(cls):
        return {
            "model_path": cls.model_path,
            "loaded_at":  cls.loaded_at,
            "algo":       type(cls.model).__name__ if cls.model else None,
        }

from pydantic import BaseModel
from typing import List, Optional

class RecommandationItem(BaseModel):
    book_id:    str
    score:      float

class RecommandationResponse(BaseModel):
    user_id:         str
    recommandations: List[RecommandationItem]
    total:           int

class TrainRequest(BaseModel):
    n_factors:  Optional[int] = 50
    n_epochs:   Optional[int] = 20
    lr_all:     Optional[float] = 0.005
    reg_all:    Optional[float] = 0.02

class TrainResponse(BaseModel):
    message:  str
    rmse:     float
    mae:      float
    n_users:  int
    n_items:  int

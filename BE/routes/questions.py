from fastapi import APIRouter
from pydantic import BaseModel
from services.openai_service import generate_questions

router = APIRouter()

class FieldRequest(BaseModel):
    field: str

@router.post("/generate-questions")
async def get_questions(data: FieldRequest):
    questions = generate_questions(data.field)
    return {"questions": questions}

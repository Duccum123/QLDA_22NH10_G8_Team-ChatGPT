from fastapi import APIRouter, UploadFile, File
from services.emotion_service import analyze_face_emotion

router = APIRouter()

@router.post("/analyze-face")
async def analyze_face(file: UploadFile = File(...)):
    emotion = analyze_face_emotion(file)
    return {"emotion": emotion}

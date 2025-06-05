from fastapi import APIRouter, UploadFile, File
from services.whisper_service import transcribe_audio

router = APIRouter()

@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    text = transcribe_audio(file)
    print(text)
    return {"transcript": text}

import whisper
import tempfile

model = whisper.load_model("base")

def transcribe_audio(file):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tmp.write(file.file.read())
        result = model.transcribe(tmp.name)
    return result["text"]

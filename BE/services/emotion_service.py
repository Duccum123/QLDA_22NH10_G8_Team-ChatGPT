from deepface import DeepFace
import tempfile
import cv2

def analyze_face_emotion(file):
    # Lưu file ảnh tạm
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name

    try:
        result = DeepFace.analyze(img_path=tmp_path, actions=['emotion'], enforce_detection=False)
        emotion = result[0]['dominant_emotion']
        return emotion
    except Exception as e:
        return f"Error: {str(e)}"

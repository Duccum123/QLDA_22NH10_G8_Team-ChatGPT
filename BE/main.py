from fastapi import FastAPI
from routes import questions, audio, face, summary
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Cho phép những origin này gọi API
    allow_credentials=True,
    allow_methods=["*"],              # Cho phép mọi phương thức (GET, POST, PUT,...)
    allow_headers=["*"],              # Cho phép mọi header
)

app.include_router(questions.router)
app.include_router(audio.router)
app.include_router(face.router)
app.include_router(summary.router)
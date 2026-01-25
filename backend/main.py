from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lifeos-vert.vercel.app"],  # your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Keep your existing routes
@app.get("/")
def root():
    return {"status": "LifeOS backend running"}

@app.get("/health")
def health():
    return {"ok": True}

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "LifeOS backend running"}

@app.get("/health")
def health():
    return {"ok": True}

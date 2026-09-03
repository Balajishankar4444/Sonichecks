from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.analyze import router as analyze_router

app = FastAPI(
    title="Sonichecks Audio QC Engine",
    description="Deterministic Audio Quality Control Analysis Engine",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Sonichecks Audio Engine",
        "version": "1.0.0",
        "capabilities": [
            "ITU-R BS.1770-4 LUFS",
            "True Peak (dBTP) 4x Oversampling",
            "Digital Clipping Analysis",
            "Leading & Trailing Silence Detection",
            "Multi-Track Consistency Analysis",
            "PDF & CSV QC Export"
        ]
    }

@app.get("/")
async def root():
    return {
        "message": "Sonichecks Audio QC API is running. See /docs for OpenAPI specifications.",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

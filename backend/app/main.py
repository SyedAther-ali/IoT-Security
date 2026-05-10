from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import sensors, dashboard

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Secure AI-Powered IoT Landslide Detection API")

# Configure CORS for Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router, tags=["Sensors"])
app.include_router(dashboard.router, tags=["Dashboard"])

@app.get("/")
def read_root():
    return {"message": "API is running. Go to /docs for Swagger UI"}

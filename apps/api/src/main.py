from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
from routes import upload_router, generate_router
from db import Database

load_dotenv(".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialize the database on application startup.
    """
    db = Database()
    db.initialize_database()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api")
app.include_router(generate_router, prefix="/api")


@app.get("/health")
async def health_check():
    """
    Check the health of the database.
    """
    db = Database()
    if db.connect():
        db.close()
        return {"message": "Database is available and connected", "status": "healthy"}
    else:
        return {"message": "Database connection failed", "status": "unhealthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        loop="asyncio",
    )

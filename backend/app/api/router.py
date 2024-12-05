from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import completions, envs

# Initialize FastAPI app with metadata
app = FastAPI(
    title="LangMetres API",
    description="API for managing language model interactions and environments",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(
    completions.router,
    prefix="/completions",
    tags=["completions"],
    responses={
        400: {"description": "Bad Request"},
        500: {"description": "Internal Server Error"}
    }
)

app.include_router(
    envs.router,
    prefix="/envs",
    tags=["environments"],
    responses={
        400: {"description": "Bad Request"}
    }
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
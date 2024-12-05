import uvicorn
import logging
from app.api.router import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """
    Main entry point for the API server.
    Configures and starts the uvicorn server with the FastAPI application.
    """
    logger.info("Starting LangMetres API server...")
    
    # Server configuration
    config = {
        "app": "app.api.router:app",
        "host": "0.0.0.0",
        "port": 8000,
        "reload": True,  # Enable auto-reload during development
        "log_level": "info",
    }
    
    try:
        uvicorn.run(**config)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise

if __name__ == "__main__":
    main()
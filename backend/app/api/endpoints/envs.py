import os
from typing import Dict, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, SecretStr

router = APIRouter()

class EnvVarsRequest(BaseModel):
    variables: Dict[str, SecretStr] = Field(
        ...,
        description="Dictionary of environment variables to set",
        example={"OPENAI_API_KEY": "sk-..."}
    )

class EnvVarsResponse(BaseModel):
    status: Literal["success"] = "success"
    message: str = Field(..., description="Status message")
    updated_vars: list[str] = Field(..., description="List of updated environment variables")

@router.post(
    "",
    response_model=EnvVarsResponse,
    description="Set environment variables for the API",
    responses={
        400: {"description": "Invalid environment variables"},
    }
)
async def set_environment_variables(request: EnvVarsRequest) -> EnvVarsResponse:
    """
    Set environment variables for the API.
    
    Args:
        request: Dictionary containing environment variables to set
        
    Returns:
        Response containing status and list of updated variables
        
    Raises:
        HTTPException: If there's an error setting the variables
    """
    try:
        updated_vars = []
        for key, value in request.variables.items():
            if not key.strip():
                raise ValueError("Empty environment variable name")
            
            os.environ[key] = value.get_secret_value()
            updated_vars.append(key)
            
        return EnvVarsResponse(
            message=f"Successfully updated {len(updated_vars)} environment variables",
            updated_vars=updated_vars
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
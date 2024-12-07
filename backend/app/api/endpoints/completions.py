import os
import time
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from litellm import completion
router = APIRouter()

class CompletionRequest(BaseModel):
    system_prompt: Optional[str] = Field(
        default="You are a helpful AI assistant.",
        description="System instructions for the model"
    )
    user_prompt: str = Field(..., description="User input to process")
    temperature: Optional[float] = Field(
        default=0.7,
        ge=0,
        le=2,
        description="Sampling temperature between 0 and 2"
    )
    top_p: Optional[float] = Field(
        default=1,
        ge=0,
        le=1,
        description="Nucleus sampling threshold between 0 and 1"
    )

class CompletionUsage(BaseModel):
    prompt_tokens: int = Field(..., description="Number of tokens in the prompt")
    completion_tokens: int = Field(..., description="Number of tokens in the completion")
    total_tokens: int = Field(..., description="Total tokens used")
    cost: float = Field(..., description="Cost of the completion")
    latency: float = Field(..., description="Response time in seconds")

class CompletionResponseContent(BaseModel):
    response_content: str = Field(..., description="Model's response text")
    model_name: str = Field(..., description="Name of the model used")
    usage: CompletionUsage

class CompletionResponse(BaseModel):
    status: Literal["success"] = "success"
    response: CompletionResponseContent

@router.post(
    "/{model_name}",
    response_model=CompletionResponse,
    description="Create a completion using the specified model",
    responses={
        400: {"description": "Invalid request"},
        500: {"description": "Model error"}
    }
)
async def create_completion(model_name: str, request: CompletionRequest) -> CompletionResponse:
    """
    Create a completion using the specified model.
    
    Args:
        model_name: The name of the model to use
        request: The completion request containing prompts
        
    Returns:
        CompletionResponse containing the model's response and usage statistics
        
    Raises:
        HTTPException: If there's an error with the model or request
    """
    try:
        start_time = time.time()
        
        response = completion(
            model=model_name,
            messages=[
                {"role": "system", "content": request.system_prompt} if request.system_prompt else None,
                {"role": "user", "content": request.user_prompt}
            ],
            temperature=request.temperature,
            top_p=request.top_p
        )
        
        latency = time.time() - start_time
        
        return CompletionResponse(
            response=CompletionResponseContent(
                response_content=response.choices[0].message.content,
                model_name=model_name,
                usage=CompletionUsage(
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens,
                    cost=response._hidden_params["response_cost"],
                    latency=latency
                )
            )
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
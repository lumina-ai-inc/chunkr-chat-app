from fastapi import Request, HTTPException


def get_api_keys_from_headers(request: Request) -> dict[str, str]:
    """
    Extract API keys from request headers.
    
    Args:
        request: FastAPI Request object
        
    Returns:
        dict: Dictionary containing the API keys
        
    Raises:
        HTTPException: If any required API key is missing
    """
    openai_key = request.headers.get("X-OpenAI-API-Key")
    openrouter_key = request.headers.get("X-OpenRouter-API-Key") 
    chunkr_key = request.headers.get("X-Chunkr-API-Key")
    
    missing_keys = []
    if not openai_key:
        missing_keys.append("X-OpenAI-API-Key")
    if not openrouter_key:
        missing_keys.append("X-OpenRouter-API-Key")
    if not chunkr_key:
        missing_keys.append("X-Chunkr-API-Key")
        
    if missing_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required API key headers: {', '.join(missing_keys)}"
        )
    
    return {
        "openai": openai_key,
        "openrouter": openrouter_key,
        "chunkr": chunkr_key
    } 
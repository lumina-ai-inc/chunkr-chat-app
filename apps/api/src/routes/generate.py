import asyncio
import json
import os
import uuid

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI

from tools import tools, TOOL_MAPPING

router = APIRouter()

def build_system_message(task_id: str) -> str:
    """
    Build a system message for the assistant with document-specific instructions.
    
    Args:
        task_id (str): The unique identifier for the document/task
        
    Returns:
        str: A formatted system message containing instructions for the assistant
    """
    return f"""
        You are a specialized assistant designed to answer questions about a specific document with task_id: {task_id}.

        ## Your Primary Objectives:
        1. Assume that all the questions are about the provided document
        2. Use available tools to retrieve relevant information
        3. Provide accurate citations for all claims
        4. Format responses consistently

        ## Available Tools:
        - `query_embeddings`: Find and retrieve relevant document segments

        ## Response Requirements:

        ### Information Retrieval:
        - ALWAYS use the `query_embeddings` tool to find relevant document segments
        - Base your answers exclusively on the retrieved segment content
        - If initial queries don't yield sufficient information, modify your search terms and try again

        ### Citation Guidelines:
        - Every statement using document information MUST include inline citations using square brackets [1], [2], etc.
        - Citations should be numbered sequentially starting from [1]
        - Reuse the same number if referencing the same segment multiple times
        - For multiple sources supporting one claim, use format: [1, 2]

        ### Response Format:
        Structure your response as JSON with the following format:
        ```json
        {{
          "metadata": {{
            "citations": ["segment123", "segment456"],
            "images": ["image_url1", "image_url2"]
          }},
          "response": "Your formatted response with inline citations [1]. Additional information from another source [2]. Combined evidence [1, 2]."
        }}
        ```

        ### Content Formatting:
        - Use proper Markdown formatting (especially for tables)
        - Use LaTeX only for complex mathematical expressions
        - Ensure readability and clear structure

        ### Important Rules:
        - Citation numbers must correspond to segment positions in the citations array
        - Include segment images in the images array when available
        - The number of unique citations should match the citations array length
        - If you cannot find relevant information, modify the query for the query_embeddings tool and try again.
    """

def ensure_valid_message_id(message):
    """
    Ensure the message has a valid ID that starts with 'msg_'.
    
    Args:
        message (dict): The message object to add an ID to
        
    Returns:
        dict: A copy of the message with a valid ID added
    """
    msg_copy = message.copy()
    msg_copy["id"] = f"msg_{uuid.uuid4().hex}"
    return msg_copy

async def execute_tool_call(messages: list, tool_call: dict):
    """
    Execute a tool call and return both the tool info and result.
    
    Args:
        messages (list): List of chat messages to append the tool call and result to
        tool_call (dict): The tool call object containing function name and arguments
        
    Returns:
        dict: Tool information containing type, tool_name, and arguments
        
    Raises:
        ValueError: If the tool name is not found in TOOL_MAPPING
    """
    messages.append(ensure_valid_message_id({
        "role": "assistant",
        "content": None,
        "tool_calls": [
            {
                "id": tool_call.id,
                "type": "function",
                "function": {
                    "name": tool_call.function.name,
                    "arguments": tool_call.function.arguments
                }
            }
        ],
    }))
    
    name = tool_call.function.name
    args = json.loads(tool_call.function.arguments)
    tool_func = TOOL_MAPPING.get(name)
    if not tool_func:
        raise ValueError(f"Unknown tool: {name}")
    
    tool_info = {
        "type": "tool_call",
        "tool_name": name,
        "arguments": args
    }
    
    if asyncio.iscoroutinefunction(tool_func):
        tool_result = await tool_func(**args)
    else:
        tool_result = tool_func(**args)
    
    if name in ("query_embeddings") and isinstance(tool_result, dict) and "response" in tool_result:
        content = tool_result["response"]
    else:
        content = tool_result
        
    messages.append(ensure_valid_message_id({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": json.dumps(content) if isinstance(content, (dict, list)) else str(content),
    }))
    
    return tool_info

@router.post("/generate")
async def chat_route(request: Request):
    """
    Handle chat generation requests with streaming responses.
    
    This endpoint processes chat messages, executes tool calls when needed,
    and streams back the assistant's response with proper citations and images.
    
    Args:
        request (Request): FastAPI request object containing JSON payload with:
            - messages (list): List of chat messages
            - task_id (str): Unique identifier for the document/task
            - model (str): The AI model to use for generation
            
    Returns:
        StreamingResponse: A streaming response containing tool calls and final response
        
    Raises:
        HTTPException: If required fields (messages, task_id, model) are missing
    """
    payload = await request.json()
    messages = payload.get("messages")
    task_id = payload.get("task_id")
    model = payload.get("model")

    if not messages or not task_id or not model:
        raise HTTPException(status_code=400, detail="`messages` and `task_id` are required")
    
    async def event_generator():
        """
        Generate streaming events for tool calls and final response.
        
        This async generator handles the conversation flow, executing tool calls
        as needed and streaming the final assistant response with proper formatting.
        
        Yields:
            str: JSON-formatted chunks containing tool calls or response content
        """
        client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.getenv("OPENROUTER_API_KEY"))
        system_message = build_system_message(task_id)
        
        # Create chat messages with proper IDs
        chat_messages = [ensure_valid_message_id({"role": "system", "content": system_message})]
        
        # Add messages with valid IDs
        for msg in messages:
            chat_messages.append(ensure_valid_message_id(msg))

        # Handle tool calls and stream tool information
        while True:
            resp = client.chat.completions.create(
                model=model,
                messages=chat_messages,
                tools=tools,
            )
            message = resp.choices[0].message
            
            if message.tool_calls:
                # Stream tool call information
                tool_info = await execute_tool_call(chat_messages, message.tool_calls[0])
                yield json.dumps(tool_info) + "\n"
                continue
            
            # No more tool calls, append final assistant response and break
            assistant_content = message.content or ""
            chat_messages.append(ensure_valid_message_id({"role": "assistant", "content": assistant_content}))
            break

        # Now stream the final assistant's reply
        stream_resp = client.chat.completions.create(
            model=model,
            messages=chat_messages,
            stream=True,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "cited_response",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "metadata": {
                                "type": "object", 
                                "properties": {
                                    "citations": {"type": "array", "items": {"type": "string"}}, 
                                    "images": {"type": "array", "items": {"type": "string"}}
                                },
                                "required": ["citations", "images"],
                                "additionalProperties": False
                            },
                            "response": {"type": "string"}
                        },
                        "additionalProperties": False,
                        "required": ["metadata", "response"]
                    }
                }
            }
        )
        
        # Stream the final response
        for chunk in stream_resp:
            if chunk.choices[0].delta.content:
                response_chunk = {
                    "type": "response",
                    "content": chunk.choices[0].delta.content
                }
                yield json.dumps(response_chunk) + "\n"

    return StreamingResponse(event_generator(), media_type="text/plain") 
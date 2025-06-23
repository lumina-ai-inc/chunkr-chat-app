import base64
import os
import tiktoken
from datetime import datetime
from typing import Optional

import openai
from chunkr_ai import Chunkr
from fastapi import APIRouter, HTTPException, UploadFile, File, Request

from chunkr_config import get_chunkr_config
# from db import get_db_client
from db import get_database_connection

EMBEDDING_MODEL = "text-embedding-3-small"
TOKEN_LIMIT = 8191

openai.api_key = os.getenv("OPENAI_API_KEY")
router = APIRouter()
# supabase = get_db_client()
encoder = tiktoken.get_encoding("cl100k_base")


@router.post("/upload")
async def upload(request: Request, file: Optional[UploadFile] = File(None)):
    """
    Upload and process a PDF file or URL for text extraction, chunking, and embedding generation.

    This endpoint accepts either a PDF file upload or a URL to a PDF document. It processes
    the document using the Chunkr service to extract text chunks, generates embeddings for
    each chunk using OpenAI's embedding model, and stores the results in Supabase.

    Args:
        request (Request): FastAPI request object containing potential JSON body with URL
        file (Optional[UploadFile]): PDF file to upload and process (optional)

    Returns:
        dict: Dictionary containing the task_id of the processed document

    Raises:
        HTTPException:
            - 400: If neither URL nor file provided, or both provided
            - 400: If no valid chunks found after processing
            - 400: If no valid text chunks found after filtering
            - 500: If error occurs during embedding generation or processing

    Note:
        - Only one input method (file or URL) can be provided per request
        - Text chunks exceeding the token limit will be truncated
        - Empty chunks are filtered out during processing
        - Embeddings are generated in batch for efficiency
    """
    try:
        # Try to get URL from JSON body
        url = None
        try:
            body = await request.json()
            url = body.get("url")
        except Exception:
            pass

        # Validate that only one input is provided
        if (file is None and url is None) or (file is not None and url is not None):
            raise HTTPException(
                status_code=400,
                detail="Please provide either a URL or a file, but not both or neither",
            )

        # Get the configuration
        config = get_chunkr_config()

        # Initialize the Chunkr client with your API key
        chunkr = Chunkr(api_key=os.getenv("CHUNKR_API_KEY"))

        if url is not None:
            # Handle URL upload
            task = await chunkr.upload(url, config=config)
        else:
            # Handle file upload
            content = await file.read()
            base64_pdf = base64.b64encode(content).decode("utf-8")
            task = await chunkr.upload(base64_pdf, config=config)

        # If the task is completed successfully, generate embeddings for all chunks in batch
        if task.status == "Succeeded":
            # Extract text from all chunks and filter by token count
            valid_chunks = []

            for i, chunk in enumerate(task.output.chunks):
                chunk_text = chunk.embed.strip()
                # Skip empty strings
                if not chunk_text:
                    continue

                token_count = len(encoder.encode(chunk_text))

                if token_count <= TOKEN_LIMIT:
                    valid_chunks.append(
                        {
                            "chunk": chunk,
                            "text": chunk_text,
                        }
                    )
                else:
                    # Don't skip but strip the chunk to the token limit
                    chunk_text = chunk_text[:TOKEN_LIMIT]
                    valid_chunks.append(
                        {
                            "chunk": chunk,
                            "text": chunk_text,
                        }
                    )

            if not valid_chunks:
                raise HTTPException(
                    status_code=400,
                    detail="No valid chunks found - all chunks were either empty or exceeded token limit",
                )

            # Extract text from valid chunks for embeddings
            chunk_texts = [chunk["text"] for chunk in valid_chunks]

            if not chunk_texts:
                raise HTTPException(
                    status_code=400,
                    detail="No valid text chunks found after filtering empty strings",
                )

            try:
                # Batch generate embeddings using OpenAI
                embedding_response = openai.embeddings.create(
                    model=EMBEDDING_MODEL, input=chunk_texts
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error creating embeddings: {str(e)}"
                )

            # Prepare batch upsert data
            embeddings_data = []
            for i, chunk_data in enumerate(valid_chunks):
                chunk = chunk_data["chunk"]
                embeddings_data.append(
                    {
                        "id": chunk.chunk_id,
                        "content": chunk_data["text"],
                        "embedding": embedding_response.data[i].embedding,
                        "task_id": task.task_id,
                        "created_at": datetime.now().isoformat(),
                    }
                )

            if embeddings_data:
                db = get_database_connection()
                if not db:
                    raise HTTPException(status_code=500, detail="Failed to connect to database")
                
                try:
                    # Insert file record
                    db.execute_query("""
                        INSERT INTO public.files (id, file_url, created_at) 
                        VALUES (%s, %s, %s)
                        ON CONFLICT (id) DO NOTHING
                    """, (task.task_id, task.output.pdf_url, datetime.now().isoformat()), commit=True)

                    # Insert embeddings
                    for embedding_data in embeddings_data:
                        db.execute_query("""
                            INSERT INTO public.embeddings (id, task_id, content, embedding, created_at)
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (id) DO UPDATE SET
                                content = EXCLUDED.content,
                                embedding = EXCLUDED.embedding,
                                created_at = EXCLUDED.created_at
                        """, (
                            embedding_data["id"],
                            embedding_data["task_id"], 
                            embedding_data["content"],
                            embedding_data["embedding"],
                            embedding_data["created_at"]
                        ), commit=True)
                    
                finally:
                    db.close()

                # if using supabase
                # supabase.table("files").insert(
                #     {
                #         "id": task.task_id,
                #         "file_url": task.output.pdf_url,
                #         "created_at": datetime.now().isoformat(),
                #     }
                # ).execute()

                # supabase.table("embeddings").upsert(embeddings_data).execute()

        return {"task_id": task.task_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/task/{task_id}")
async def get_task(task_id: str):
    """
    Retrieve the status and details of a document processing task.

    This endpoint fetches information about a previously submitted document processing
    task using the Chunkr service.

    Args:
        task_id (str): The unique identifier of the task to retrieve

    Returns:
        dict: Dictionary containing task information with the following structure:
            - If successful: {"task": <Task object with chunks>}
            - If pending/failed: {"task": <Task object with status>}

    Raises:
        HTTPException:
            - 500: If error occurs while retrieving task from Chunkr service
    """
    try:
        chunkr = Chunkr(api_key=os.getenv("CHUNKR_API_KEY"))

        task = await chunkr.get_task(task_id, include_chunks=True)

        if task.status == "Succeeded":
            response = {"task": task}
            return response
        else:
            return {"task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

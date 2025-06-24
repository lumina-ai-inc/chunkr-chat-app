# from db import get_db_client
from db import get_database_connection
from chunkr_ai import Chunkr
import openai
import os

# supabase = get_db_client()


async def get_chunk_information(chunk_id: str, file_id: str):
    """
    Retrieve detailed information about a specific chunk from a file.

    This function fetches chunk data including content, segments, and metadata
    such as whether the chunk contains tables or pictures.

    Args:
        chunk_id (str): The unique identifier of the chunk to retrieve
        file_id (str): The unique identifier of the file containing the chunk

    Returns:
        dict: Dictionary with 'response' key containing either:

            Success:
                chunk_id (str): The chunk identifier
                content (str): The embedded content of the chunk
                has_tables (bool): Whether the chunk contains tables
                has_pictures (bool): Whether the chunk contains pictures
                segments (list): List of segment dicts, each containing:
                    segment_id (str): Segment identifier
                    segment_type (str): Type of segment
                    markdown (str, optional): Markdown content if available

            Error:
                error (str): Error message "Chunk not found"
    """
    chunkr = Chunkr(api_key=os.getenv("CHUNKR_API_KEY"))

    task = await chunkr.get_task(file_id, base64_urls=True)
    chunks = task.output.chunks

    for chunk in chunks:
        if chunk.chunk_id == chunk_id:
            chunk_dict = {
                "chunk_id": chunk.chunk_id,
                "content": chunk.embed,
                "segments": [],
            }

            if hasattr(chunk, "segments") and chunk.segments:
                for segment in chunk.segments:
                    segment_type = str(segment.segment_type)

                    # Add segment info
                    segment_dict = {
                        "segment_id": segment.segment_id,
                        # only add image for tables and pictures
                        "segment_images": segment.image
                        if segment_type == "SegmentType.TABLE"
                        or segment_type == "SegmentType.PICTURE"
                        else None,
                    }

                    # Add markdown content
                    if hasattr(segment, "markdown") and segment.markdown:
                        segment_dict["markdown"] = segment.markdown

                    chunk_dict["segments"].append(segment_dict)

            return {"response": chunk_dict}

    return {"response": {"error": "Chunk not found"}}


async def query_embeddings(
    query: str, file_id: str, threshold: float = 0.1, limit: int = 3
):
    """
    Search for similar chunks in the database using semantic similarity.

    This function creates an embedding for the input query and searches for
    similar chunks in the database using cosine similarity.

    Args:
        query (str): The search query text to find similar chunks
        file_id (str): The unique identifier of the file to search within
        threshold (float, optional): Minimum similarity threshold for results.
                                   Defaults to 0.1.
        limit (int, optional): Maximum number of results to return. Defaults to 10.

    Returns:
        dict: Dictionary with 'results' key containing a list of matching chunks, every chunk has:
            id (str): The chunk identifier
            content (str): The chunk content
            similarity (float): Similarity score between query and chunk
    """

    openai.api_key = os.getenv("OPENAI_API_KEY")

    embedding_response = openai.embeddings.create(
        model="text-embedding-3-small", input=[query]
    )
    query_embedding = embedding_response.data[0].embedding

    db = get_database_connection()
    if not db:
        raise Exception("Failed to connect to database")

    try:
        # Execute the match_embeddings function directly with proper type casting
        success = db.execute_query(
            """
            SELECT id, content, similarity FROM match_embeddings(%s::vector(1536), %s::float, %s::integer, %s::text)
        """,
            (query_embedding, threshold, limit, file_id),
        )

        formatted_results_data = []
        if success and db.cursor.rowcount > 0:
            results = db.cursor.fetchall()

            # Convert to list of dictionaries
            for row in results:
                formatted_results_data.append(
                    {"id": row[0], "content": row[1], "similarity": row[2]}
                )

    except Exception:
        formatted_results_data = []
    finally:
        db.close()

    # if using supabase
    # response = supabase.rpc(
    #     "match_embeddings",
    #     {
    #         "query_embedding": query_embedding,
    #         "match_threshold": threshold,
    #         "match_count": limit,
    #         "input_task_id": file_id,
    #     },
    # ).execute()
    # results = response.data

    # Sort by similarity
    formatted_results_data.sort(key=lambda x: x["similarity"], reverse=True)

    formatted_results = []

    # Find segments for the chunk_ids
    for row in formatted_results_data:
        chunk_id = row["id"]

        # Get the chunk information
        chunk_info = await get_chunk_information(chunk_id, file_id)
        chunk_segments = chunk_info["response"]["segments"]

        formatted_results.append(
            {
                # "id": chunk_id, # if you want to do chunk_level citations
                "similarity": row["similarity"],
                "segments": chunk_segments,
            }
        )

    return {"results": formatted_results}


tools = [
    {
        "type": "function",
        "function": {
            "name": "query_embeddings",
            "description": "Search for chunks in the database based on the given a RAG-based query and a file_id",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The query to search for in the database",
                    },
                    "file_id": {
                        "type": "string",
                        "description": "The file_id of the file to search for in the database",
                    },
                },
                "required": ["query", "file_id"],
            },
        },
    },
]

TOOL_MAPPING = {
    "query_embeddings": query_embeddings,
}

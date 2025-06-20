import psycopg2
from dotenv import load_dotenv
import os
from typing import Optional, Tuple
from supabase import create_client, Client


class Database:
    def __init__(self):
        self.connection = None
        self.cursor = None

    def connect(self) -> bool:
        """Establish a connection to the database.

        Returns:
            bool: True if connection was successful, False otherwise
        """
        try:
            load_dotenv()

            USER = os.getenv("user")
            PASSWORD = os.getenv("password")
            HOST = os.getenv("host")
            PORT = os.getenv("port")
            DBNAME = os.getenv("dbname")

            self.connection = psycopg2.connect(
                user=USER,
                password=PASSWORD,
                host=HOST,
                port=PORT,
                dbname=DBNAME,
                gssencmode="disable",
            )
            self.cursor = self.connection.cursor()
            return True
        except Exception as e:
            print(f"Failed to connect: {e}")
            return False

    def close(self) -> None:
        """Close the database connection and cursor."""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()

    def execute_query(
        self, query: str, params: Optional[Tuple] = None, commit: bool = False
    ) -> bool:
        """Execute a SQL query.

        Args:
            query: SQL query to execute
            params: Query parameters (optional)
            commit: Whether to commit after execution

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)

            if commit:
                self.connection.commit()
            return True
        except Exception as e:
            print(f"Query execution failed: {e}")
            return False

    def enable_pgvector_extension(self) -> bool:
        """Enable the pgvector extension if not already enabled.

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.execute_query("CREATE EXTENSION IF NOT EXISTS vector")
            self.connection.commit()
            return True
        except Exception as e:
            print(f"Failed to enable pgvector extension: {e}")
            return False

    def create_tables(self) -> bool:
        """Create necessary tables if they don't exist.

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create files table
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS public.files (
                    id VARCHAR(255) PRIMARY KEY,
                    file_url TEXT,
                    created_at TIMESTAMP
                )
            """)

            # Create embeddings table
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS public.embeddings (
                    id VARCHAR(255) PRIMARY KEY,
                    task_id VARCHAR(255) REFERENCES public.files(id),
                    content TEXT,
                    embedding VECTOR(1536),
                    created_at TIMESTAMP
                )
            """)

            self.connection.commit()
            return True
        except Exception as e:
            print(f"Failed to create tables: {e}")
            return False

    def create_index(self) -> bool:
        """Create index on the embedding column for faster similarity searches.

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.execute_query("""
                CREATE INDEX IF NOT EXISTS embeddings_idx 
                ON public.embeddings 
                USING hnsw (embedding vector_cosine_ops)
            """)

            self.connection.commit()
            return True
        except Exception as e:
            print(f"Failed to create index: {e}")
            return False

    def create_matching_function(self) -> bool:
        """Create or replace the function for matching embeddings.

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.execute_query("""
                CREATE OR REPLACE FUNCTION public.match_embeddings(
                    query_embedding vector(1536),
                    match_threshold float,
                    match_count integer,
                    input_task_id text
                )
                RETURNS TABLE (
                    id varchar(255),
                    content text,
                    similarity float
                ) 
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    RETURN QUERY
                    SELECT 
                        e.id,
                        e.content,
                        1 - (e.embedding <=> query_embedding) as similarity
                    FROM 
                        public.embeddings e
                    WHERE 
                        e.task_id = input_task_id
                        AND 1 - (e.embedding <=> query_embedding) > match_threshold
                    ORDER BY 
                        similarity DESC
                    LIMIT match_count;
                END;
                $$;
            """)

            self.connection.commit()
            return True
        except Exception as e:
            print(f"Failed to create matching function: {e}")
            return False

    def initialize_database(self) -> bool:
        """Initialize the database by enabling pgvector extension, creating tables, index, and matching function.

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connect():
            return False

        try:
            self.enable_pgvector_extension()
            self.create_tables()
            self.create_index()
            self.create_matching_function()
            return True
        except Exception as e:
            print(f"Failed to initialize database: {e}")
            return False
        finally:
            self.close()


def get_database_connection() -> Optional[Database]:
    """Get a Database instance with an active connection.

    Returns:
        Optional[Database]: A connected Database instance or None if connection failed
    """
    db = Database()
    if db.connect():
        return db
    return None


def get_supabase_client() -> Client:
    """Initialize and return a Supabase client.

    Returns:
        Client: A configured Supabase client instance
    """
    load_dotenv()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    return create_client(supabase_url, supabase_key)

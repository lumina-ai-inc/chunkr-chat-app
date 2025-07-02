## API

The setup for the backend in simple. We use [uv](https://docs.astral.sh/uv/) for dependency management. Set it up if you haven't already. Follow the instructions [here](https://docs.astral.sh/uv/getting-started/installation/) to install uv.

### 1. Set up environment variables

```bash
cp .env.example .env
```

<!-- The `.env` already has some default environment variables set up. You can change them to your liking. Follow the [Chunkr guide](https://docs.chunkr.ai/docs/get-started/quickstart#step-1-sign-up-and-create-an-api-key) to create an API key. For [OpenRouter](https://openrouter.ai/), you can get an API key from their [website](https://openrouter.ai/settings/keys). For OpenAI head [here](https://platform.openai.com/api-keys). -->

### 4. Set up Database

You have a couple of options for setting up the database:

- Use Supabase (either cloud or CLI)
- Use a local PostgreSQL instance through Docker

#### 4.1. Use Supabase Cloud

Head over to [Supabase](https://supabase.com/) to create a new project.

> NOTE: For Supabase getting the correct key straight from the dashboard can be a bit tricky. If you run the Docker containers or have Supabase running locally, the anon keys are easily visible. But if you are on their dashboard and logged into your project, hit ⌘ + k and search for `API keys` and copy the anonymous API key.

<div align="center" style="display: flex; justify-content: center; flex-direction: row; gap: 20px;">
  <img src="https://t7nw0vdho0.ufs.sh/f/wvRR96mLyWoQK5mC22TTo2I7ranDNmQjKq8wAbVZFCE9Uvg6" alt="Supabase API Keys" width="450" >
  <img src="https://t7nw0vdho0.ufs.sh/f/wvRR96mLyWoQWQxXQNJVmpUZczt45sOnMiDTadhfFJP1IgKQ" alt="Supabase API Keys" width="450" >
</div>

#### 4.2. Use Supabase CLI

If you plan to use Supabase locally for development, CLI is the recommended way to go. Head over to the [documentation](https://supabase.com/docs/guides/local-development/cli/getting-started) to set up the CLI. This will get you setup with the full stack of Supabase including the database, storage, and auth.

We recommend initializing the project in the `apps/api` directory.

#### 4.3. Use a local PostgreSQL instance through Docker

If you want to use a local PostgreSQL instance through Docker check out the [compose.yaml](../../compose.yaml) file.

> NOTE: If you want visualization of the database through this method, we recommend using [Postico](https://eggerapps.at/postico/) for macOS.

### 5. Run the application

```bash
uv run src/main.py
```

The application will run on port `8000` by default. Send a `GET` request to `/health` to see if the application is set up correctly.

### 6. Structure of the application

[routes](./src/routes) - The routes for the application. Look at the [Chunkr](https://docs.chunkr.ai/docs/get-started/overview) and [OpenAI](https://platform.openai.com/docs/api-reference/introduction) documentation for more information.

[tools](./src/tools.py) - The function calls for the application. Reference [function calling](https://platform.openai.com/docs/guides/function-calling) from OpenAI.

[db](./src/db.py) - The database setup for the application. Uses both [psycopg2](https://pypi.org/project/psycopg2/) and the official [Supabase Python client](https://supabase.com/docs/reference/python/introduction).

[main.py](./src/main.py) - The entry point for the application.

<!-- ### Uploading Documents

The `POST /upload` route is used to process documents through [Chunkr](https://docs.chunkr.ai/docs/get-started/quickstart#step-1%3A-sign-up-and-create-an-api-key) and generate embeddings using [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings/embedding-models).

```python
import openai
import tiktoken
from supabase import create_client

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

valid_chunks = []

for chunk in task.output.chunks:
    chunk_text = chunk.embed.strip()

    # Skip empty strings
    if not chunk_text:
        continue

    token_count = len(tiktoken.get_encoding("cl100k_base").encode(chunk_text))

    if token_count <= 8191:
        valid_chunks.append({
            'chunk': chunk,
            'text': chunk_text,
        })
    else:
        # Don't skip but strip the chunk to the token limit
        chunk_text = chunk_text[:8191]
        valid_chunks.append({
            'chunk': chunk,
            'text': chunk_text,
        })

    # Extract text from valid chunks for embeddings
    chunk_texts = [chunk['text'] for chunk in valid_chunks]

    # Batch generate embeddings using OpenAI
    embedding_response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=chunk_texts
    )

    # Prepare batch upsert data
    embeddings_data = []

    for i, chunk_data in enumerate(valid_chunks):
        chunk = chunk_data['chunk']
        embeddings_data.append({
            "id": chunk.chunk_id,
            "content": chunk_data['text'],
            "embedding": embedding_response.data[i].embedding,
            "task_id": task.task_id,
            "created_at": datetime.now().isoformat()
        })

    # Batch upsert to Supabase <- This is where the Supabase client comes in handy
    supabase.table("files").insert({
        "id": task.task_id,
        "file_url": task.output.pdf_url,
        "created_at": datetime.now().isoformat()
    }).execute()

    supabase.table("embeddings").upsert(embeddings_data).execute()
```

We generate embeddings for all the chunks simultaneously while ensuring the token count stays within the model's limit. After this, we simply upsert the relevant data into our database.

Find the complete implementation of the pipeline [here](./apps/api/src/routes/upload.py).

### Response Generation

The `POST /generate` route is used to generate responses from the model. We use the [OpenAI Python SDK](https://github.com/openai/openai-python) configured with [OpenRouter](https://openrouter.ai/) for flexibility across different model providers.

Using our semantic search function combined with the outputs from Chunkr, we have set up some basic functions at [tools.py](./apps/api/src/tools.py). These functions enable the model to pinpoint to the exact segment that it needs to reference.

Here is a basic schema that we use for [structured outputs](https://platform.openai.com/docs/guides/structured-outputs).

```python
{
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
```

Find the complete implementation of the response generation flow [here](./apps/api/src/routes/generate.py). -->

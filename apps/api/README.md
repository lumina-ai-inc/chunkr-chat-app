## Backend Setup

The setup for the backend in simple. We use [uv](https://docs.astral.sh/uv/) for dependency management. Set it up if you haven't already. Follow the instructions [here](https://docs.astral.sh/uv/getting-started/installation/) to install uv.

### 1. Make a virtual environment

```bash
uv venv .venv && source .venv/bin/activate
```

### 2. Install dependencies

```bash
uv sync
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

The `.env` already has some default environment variables set up. You can change them to your liking. Follow the [Chunkr guide](https://docs.chunkr.ai/docs/get-started/quickstart#step-1-sign-up-and-create-an-api-key) to create an API key. For [OpenRouter](https://openrouter.ai/), you can get an API key from their [website](https://openrouter.ai/settings/keys). For OpenAI head [here](https://platform.openai.com/api-keys).

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

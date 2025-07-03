## Chunkr Chat App

This repository is the source code for the guide that you can read [here](https://chunkr.ai/blog/building-better-pdf-experiences-with-chunkr). It will cover the basic setup of the application and cover how its structured.

## Architecture

<div align="center">
  <img src="./assets/architecture.png" alt="Chunkr Chat App" width="900" >
</div>

<br/>

## Demo

<div align="center">
  <img src="./assets/demo.gif" alt="Chunkr Chat App" width="900" >
</div>

<br/>

## Setup

Clone the repository to get started. We use a monorepo structure with [pnpm](https://pnpm.io/) as the package manager and [turbo](https://turborepo.com/) as the build tool.

```bash
git clone https://github.com/lumina-ai-inc/chunkr-chat-app.git
```

## Running with Docker (Recommended)

Once you have a Docker engine running, you can run the following command from the root of the application:

```bash
cd chunkr-chat-app && docker compose up
```

This command will run three services: postgres-db (database), api (backend) and web (frontend). 

The services will be available at the following ports:
- **Web (frontend):** [http://localhost:3000](http://localhost:3000)
- **API (backend):** [http://localhost:8000](http://localhost:8000)
- **Postgres database:** [http://localhost:54321](http://localhost:54321) 

## Running Without Docker

If you prefer not to use Docker, you can run the API and web applications separately. Each application has its own setup instructions:

- **API**: Handles the requests, processing the documents and generating the responses. Find the complete implementation [here](./apps/api/) and the setup instructions in [README](./apps/api/README.md)
- **Web**: Application to preview documents. Find the complete implementation of the frontend [here](./apps/web/) and the setup instructions in [README](./apps/web/README.md)
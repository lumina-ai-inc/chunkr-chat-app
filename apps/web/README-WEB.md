## WEB

We use [pnpm](https://pnpm.io/) as the package manager.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

The `.env` file is already set up with the correct environment variables. Run the following command to set up the environment variables:

```bash
cp .env.example .env
```

### 3. Run the application

```bash
pnpm dev
```

### 4. Structure of the application

#### Framework & Architecture

- Built with [Next.js](https://nextjs.org/) using [create-next-app](https://nextjs.org/docs/app/building-your-application/getting-started/create-next-app)
- Global state management using [Zustand](https://zustand-demo.pmnd.rs/)
- Streaming responses handled in [streaming-response-handler.ts](./src/helpers/streaming-response-handler.ts)
- PDF viewer component at [pdf-viewer.tsx](./src/components/pdf-viewer.tsx) uses the [react-pdf](https://github.com/wojtekmaj/react-pdf) library.

#### API Client

The types for [Chunkr](https://chunkr.ai/) at [client](./src/client) are auto-generated using the OpenAPI specification at [chunkr_openapi.json](./chunkr_openapi.json) with the [@hey-api/openapi-ts](https://github.com/hey-api/openapi-ts) library.

1. Install the code generation library:

```bash
pnpm add @hey-api/openapi-ts -D
```

2. Run the following command to generate the types:

```bash
pnpm dlx @hey-api/openapi-ts -i chunkr_openapi.json -o src/client -c @hey-api/client-fetch
```

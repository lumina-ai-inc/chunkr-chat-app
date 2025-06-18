export type ToolCall = {
  tool_name: string
  arguments: Record<string, string>
}

export type UIMessage = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  images?: string[]
  toolCalls?: ToolCall[]
}

export const toolMapping: Record<string, string> = {
  query_embeddings: 'Searching through document',
  get_chunk_information: 'Analyzing document content',
  get_chunk_images: 'Extracting images from document',
}

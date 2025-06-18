import { type Dispatch, type SetStateAction } from 'react'
import { useResponseStore } from '@/store/response-store'
import { ToolCall } from '@/types/chat'

/**
 * Handles streaming responses from the server, processing chunks of data in real-time.
 *
 * This function processes a streaming response that contains JSON data chunks, including:
 * - Tool calls that are executed during the response
 * - Response content with metadata (citations and images)
 * - Partial response parsing for incomplete JSON chunks
 *
 * @param response - The Response object containing the streaming data
 * @param setStreamingText - React state setter for updating the displayed streaming text
 * @param setMetadata - Function to update metadata containing citations and images
 * @param setStreamingToolCalls - Optional React state setter for updating tool calls in real-time
 *
 * @returns Promise that resolves to an object containing:
 *   - text: The final accumulated response text
 *   - images: Array of image URLs from the response metadata
 *   - toolCalls: Array of tool calls that were executed during the response
 *
 * @throws Error if the response body cannot be read
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/chat');
 * const result = await handleStreamingResponse(
 *   response,
 *   setStreamingText,
 *   setMetadata,
 *   setStreamingToolCalls
 * );
 * console.log('Final text:', result.text);
 * console.log('Images:', result.images);
 * console.log('Tool calls:', result.toolCalls);
 * ```
 */
export async function handleStreamingResponse(
  response: Response,
  setStreamingText: Dispatch<SetStateAction<string>>,
  setMetadata: (metadata: { citations: string[]; images: string[] }) => void,
  setStreamingToolCalls?: Dispatch<SetStateAction<ToolCall[]>>
): Promise<{
  text: string
  images: string[]
  toolCalls: ToolCall[]
}> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Failed to get reader')

  const decoder = new TextDecoder()
  let result = ''
  let responseImages: string[] = []
  let accumulatedContent = ''
  const toolCalls: ToolCall[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      try {
        const data = JSON.parse(line)

        if (data.type === 'tool_call') {
          const toolCall: ToolCall = {
            tool_name: data.tool_name,
            arguments: data.arguments,
          }
          toolCalls.push(toolCall)

          if (setStreamingToolCalls) {
            setStreamingToolCalls((prev) => [...prev, toolCall])
          }
        } else if (data.type === 'response') {
          accumulatedContent += data.content

          try {
            const jsonResponse = JSON.parse(accumulatedContent)

            if (jsonResponse.metadata) {
              if (
                jsonResponse.metadata.citations &&
                jsonResponse.metadata.citations.length > 0
              ) {
                setMetadata({
                  citations: jsonResponse.metadata.citations,
                  images: jsonResponse.metadata.images || [],
                })
              }

              if (
                jsonResponse.metadata.images &&
                jsonResponse.metadata.images.length > 0
              ) {
                responseImages = jsonResponse.metadata.images
                const currentMetadata = useResponseStore.getState().metadata
                setMetadata({
                  citations: currentMetadata.citations,
                  images: jsonResponse.metadata.images,
                })
              }
            }

            if (jsonResponse.response) {
              setStreamingText(jsonResponse.response)
              result = jsonResponse.response
            }
          } catch (error) {
            const responseMatch = /"response"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/
            const match = accumulatedContent.match(responseMatch)

            if (match && match[1]) {
              const partialResponse = match[1].replace(/\\(.)/g, '$1')
              setStreamingText(partialResponse)
              result = partialResponse
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse streaming chunk:', error)
      }
    }
  }

  return { text: result, images: responseImages, toolCalls }
}

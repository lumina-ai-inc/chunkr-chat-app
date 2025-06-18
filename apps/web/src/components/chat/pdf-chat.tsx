'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import AssistantMessage from '@/components/chat/assistant-message'
import UserMessage from '@/components/chat/user-message'
import AssistantLoader from '@/components/chat/assistant-loader'
import { ToolCall, UIMessage } from '@/types/chat'
import { useResponseStore } from '@/store/response-store'
import { handleStreamingResponse } from '@/helpers/streaming-response-handler'
import ModelSelect from '@/components/chat/model-select'
import { BboxToggle } from '@/components/ui/bbox-toggle'

export default function PDFChat({ taskId }: { taskId: string }) {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCall[]>([])
  const [selectedModel, setSelectedModel] = useState(
    'google/gemini-2.5-flash-preview-05-20'
  )
  const setMetadata = useResponseStore((state) => state.setMetadata)
  const showAllBboxes = useResponseStore((state) => state.showAllBboxes)
  const setShowAllBboxes = useResponseStore((state) => state.setShowAllBboxes)

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: UIMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      setStreamingText('')
      setStreamingToolCalls([])
      setMetadata({ citations: [], images: [] })
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [...messages, userMessage],
            task_id: taskId,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const {
        text: fullResponse,
        images,
        toolCalls,
      } = await handleStreamingResponse(
        response,
        setStreamingText,
        setMetadata,
        setStreamingToolCalls
      )

      const assistantMessage: UIMessage = {
        id: Date.now().toString(),
        content: fullResponse,
        role: 'assistant',
        timestamp: new Date(),
        images: images,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
      setInputMessage('')
      setStreamingText('')
      setStreamingToolCalls([])
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="py-2 px-4 text-sm flex-shrink-0 justify-end items-center gap-2 hidden md:flex">
        <BboxToggle showAllBboxes={showAllBboxes} onToggle={setShowAllBboxes} />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}
          >
            {message.role === 'assistant' && (
              <AssistantMessage message={message} />
            )}
            {message.role === 'user' && <UserMessage message={message} />}
          </div>
        ))}
        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <AssistantLoader toolCalls={streamingToolCalls} />
          </div>
        )}
        {streamingText && (
          <div className="flex justify-start">
            <AssistantMessage
              message={{
                id: 'streaming',
                content: streamingText,
                role: 'assistant',
                timestamp: new Date(),
                toolCalls:
                  streamingToolCalls.length > 0
                    ? streamingToolCalls
                    : undefined,
              }}
            />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2 flex-shrink-0">
        <div className="flex gap-2 flex-col rounded-2xl p-2 min-h-24 w-full border border-border">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Let your questions begin."
            className="resize-none min-h-9 overflow-hidden border-none font-medium placeholder:font-medium shadow-none"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <div className="flex flex-row items-center justify-between">
            <ModelSelect
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={isLoading}
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

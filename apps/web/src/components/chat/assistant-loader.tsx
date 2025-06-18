import ChatAvatar from '@/components/chat/chat-avatar'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { ToolCall, toolMapping } from '@/types/chat'

export default function AssistantLoader({
  toolCalls,
}: {
  toolCalls: ToolCall[]
}) {
  return (
    <div className="flex justify-start">
      <div className="flex flex-row gap-2 items-start">
        <ChatAvatar />
      </div>
      <div className="py-2 px-3 rounded-xl text-sm font-medium flex flex-row gap-2 items-center">
        <TextShimmer
          duration={1.2}
          className="text-sm font-medium [--base-color:var(--muted-foreground)] [--base-gradient-color:var(--muted)]"
        >
          {toolCalls.length > 0
            ? toolMapping[toolCalls[toolCalls.length - 1].tool_name]
            : 'Thinking'}
        </TextShimmer>
      </div>
    </div>
  )
}

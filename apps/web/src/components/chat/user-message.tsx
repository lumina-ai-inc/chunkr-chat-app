import { UIMessage } from '@/types/chat'

export default function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="py-2 px-3 rounded-lg max-w-sm bg-muted font-medium text-sm whitespace-pre-wrap">
      {message.content}
    </div>
  )
}

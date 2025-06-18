import ChatAvatar from '@/components/chat/chat-avatar'
import { UIMessage } from '@/types/chat'
import { parseMessageContent } from '@/components/chat/message-parser'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

export default function AssistantMessage({ message }: { message: UIMessage }) {
  const [showImages, setShowImages] = useState(false)

  return (
    <div className="flex flex-row gap-2 items-start max-w-[100%]">
      <ChatAvatar />
      <div className="flex flex-col gap-2">
        <div className="py-2 px-3 rounded-xl font-medium text-sm prose max-w-none">
          {parseMessageContent(message.content)}
        </div>
        {message.images && message.images.length > 0 && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowImages(!showImages)}
              variant="outline"
              size="sm"
              className="w-fit mx-2 p-0 text-sm text-muted-foreground"
            >
              {showImages ? (
                <>
                  <ChevronUpIcon />
                  Hide Images
                </>
              ) : (
                <>
                  <ChevronDownIcon />
                  Show Images
                </>
              )}
            </Button>
            {showImages && (
              <div className="flex flex-wrap gap-2 mx-2">
                {message.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="max-w-full h-[50%] object-contain"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

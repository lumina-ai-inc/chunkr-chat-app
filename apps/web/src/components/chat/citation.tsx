import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useResponseStore } from '@/store/response-store'

export default function Citation({ count }: { count: number }) {
  const setHoveredChunkId = useResponseStore((state) => state.setHoveredChunkId)
  const hoveredChunkId = useResponseStore((state) => state.hoveredChunkId)
  const metadata = useResponseStore((state) => state.metadata)
  const chunkId = metadata.citations[count - 1]

  const handleClick = () => {
    try {
      if (chunkId) {
        if (hoveredChunkId === chunkId) {
          setHoveredChunkId(null)
        } else {
          setHoveredChunkId(chunkId)
        }
      }
    } catch (error) {
      console.error('Error handling citation hover:', error)
      setHoveredChunkId(null)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger className="select-none" asChild onClick={handleClick}>
          <span className="inline-flex items-center hover:cursor-pointer justify-center w-4 h-4 text-[10px] font-medium rounded-full bg-primary/10 text-primary mx-[1px] align-text-top">
            {count}
          </span>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )
}

'use client'

import { PanelResizeHandle } from 'react-resizable-panels'
import { cn } from '@/lib/utils'

interface ResizeHandleProps {
  className?: string
}

export function ResizeHandle({ className }: ResizeHandleProps) {
  return (
    <PanelResizeHandle
      className={cn(
        'relative flex w-1 hover:bg-accent items-center justify-center bg-muted after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className
      )}
    ></PanelResizeHandle>
  )
}

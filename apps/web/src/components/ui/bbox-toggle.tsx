'use client'

import { Switch } from '@/components/ui/switch'

export function BboxToggle({
  showAllBboxes,
  onToggle,
  className = '',
}: {
  showAllBboxes: boolean
  onToggle: (showAll: boolean) => void
  className?: string
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Switch
        id="bbox-toggle"
        checked={showAllBboxes}
        onCheckedChange={onToggle}
      />
    </div>
  )
}

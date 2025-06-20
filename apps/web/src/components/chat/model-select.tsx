'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const AVAILABLE_MODELS = [
  {
    id: 'google/gemini-2.5-flash-preview-05-20',
    name: 'gemini-2.5-flash-preview',
  },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'llama-3.3-70b-instruct' },
  { id: 'openai/gpt-4o-mini', name: 'gpt-4o-mini' },
  { id: 'openai/o4-mini-2025-04-16', name: 'o4-mini' },
]

export default function ModelSelect({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string
  onModelChange: (model: string) => void
}) {
  return (
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger className="w-fit text-sm border-none font-medium shadow-none">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent side="top">
        {AVAILABLE_MODELS.map((model) => (
          <SelectItem className="font-medium" key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

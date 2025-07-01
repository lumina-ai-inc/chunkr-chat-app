'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, Settings } from 'lucide-react'

interface ApiKeys {
  openai: string
  openrouter: string
  chunkr: string
}

export default function ApiKeyConfig() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    openrouter: '',
    chunkr: '',
  })
  const [showKeys, setShowKeys] = useState({
    openai: false,
    openrouter: false,
    chunkr: false,
  })
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const storedKeys = {
      openai: localStorage.getItem('openai_api_key') || '',
      openrouter: localStorage.getItem('openrouter_api_key') || '',
      chunkr: localStorage.getItem('chunkr_api_key') || '',
    }
    setApiKeys(storedKeys)
  }, [])

  const handleKeyChange = (provider: keyof ApiKeys, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }))
  }

  const handleSave = () => {
    localStorage.setItem('openai_api_key', apiKeys.openai)
    localStorage.setItem('openrouter_api_key', apiKeys.openrouter)
    localStorage.setItem('chunkr_api_key', apiKeys.chunkr)

    toast.success('Configuration saved successfully!')
  }

  const toggleShowKey = (provider: keyof ApiKeys) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }))
  }

  const hasAllKeys = apiKeys.openai && apiKeys.openrouter && apiKeys.chunkr

  useEffect(() => {
    if (!hasAllKeys && !isExpanded) {
      setIsExpanded(true)
    }
  }, [hasAllKeys, isExpanded])

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="justify-start"
      >
        <Settings className="w-4 h-4 mr-2" />
        API Configuration
        {hasAllKeys && <span className="ml-auto text-green-600">✓</span>}
      </Button>

      {isExpanded && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Configure your API keys to use the chat functionality. Keys are
            stored locally in your browser.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chunkr-key">Chunkr API Key</Label>
              <div className="flex gap-2 items-end">
                <Input
                  id="chunkr-key"
                  type={showKeys.chunkr ? 'text' : 'password'}
                  value={apiKeys.chunkr}
                  onChange={(e) => handleKeyChange('chunkr', e.target.value)}
                  placeholder="chunkr_..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleShowKey('chunkr')}
                >
                  {showKeys.chunkr ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <div className="flex gap-2 items-end">
                <Input
                  id="openai-key"
                  type={showKeys.openai ? 'text' : 'password'}
                  value={apiKeys.openai}
                  onChange={(e) => handleKeyChange('openai', e.target.value)}
                  placeholder="sk-..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleShowKey('openai')}
                >
                  {showKeys.openai ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
              <div className="flex gap-2 items-end">
                <Input
                  id="openrouter-key"
                  type={showKeys.openrouter ? 'text' : 'password'}
                  value={apiKeys.openrouter}
                  onChange={(e) =>
                    handleKeyChange('openrouter', e.target.value)
                  }
                  placeholder="sk-or-..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleShowKey('openrouter')}
                >
                  {showKeys.openrouter ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save API Keys
          </Button>
        </div>
      )}
    </div>
  )
}

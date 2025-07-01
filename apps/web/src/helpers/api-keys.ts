export interface ApiKeys {
  openai: string
  openrouter: string
  chunkr: string
}

export function getApiKeys(): ApiKeys {
  if (typeof window === 'undefined') {
    return { openai: '', openrouter: '', chunkr: '' }
  }

  return {
    openai: localStorage.getItem('openai_api_key') || '',
    openrouter: localStorage.getItem('openrouter_api_key') || '',
    chunkr: localStorage.getItem('chunkr_api_key') || '',
  }
}

export function getApiHeaders(): Record<string, string> {
  const apiKeys = getApiKeys()

  return {
    'X-OpenAI-API-Key': apiKeys.openai,
    'X-OpenRouter-API-Key': apiKeys.openrouter,
    'X-Chunkr-API-Key': apiKeys.chunkr,
  }
}

export function validateApiKeys(): { isValid: boolean; missingKeys: string[] } {
  const apiKeys = getApiKeys()
  const missingKeys = []

  if (!apiKeys.openai) missingKeys.push('OpenAI')
  if (!apiKeys.openrouter) missingKeys.push('OpenRouter')
  if (!apiKeys.chunkr) missingKeys.push('Chunkr')

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  }
}

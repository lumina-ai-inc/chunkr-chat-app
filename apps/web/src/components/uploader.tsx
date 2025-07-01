'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Loader2, X } from 'lucide-react'
import { getApiHeaders, validateApiKeys } from '@/helpers/api-keys'

// URL schema validation
const urlSchema = z.string().url('Please enter a valid url')

type UploadMode = 'file' | 'url'

const Upload = () => {
  const [mode, setMode] = useState<UploadMode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        return
      }
      setFile(selectedFile)
    }
  }

  const clearFileSelection = () => {
    setFile(null)
  }

  const validateUrl = (value: string) => {
    try {
      urlSchema.parse(value)
      setUrlError(null)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setUrlError(error.errors[0].message)
      }
      return false
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUrl(value)
    if (value) {
      validateUrl(value)
    } else {
      setUrlError(null)
    }
  }

  const handleModeChange = (newMode: UploadMode) => {
    setMode(newMode)
    // Clear previous selections when switching modes
    setFile(null)
    setUrl('')
    setUrlError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (mode === 'file' && !file) return
    if (mode === 'url' && (!url || !validateUrl(url))) return

    const { isValid, missingKeys } = validateApiKeys()
    if (!isValid) {
      toast.error(
        `Missing API keys: ${missingKeys.join(', ')}. Please configure them first.`
      )
      return
    }

    setUploading(true)

    try {
      let fetchPromise: Promise<Response>
      const apiHeaders = getApiHeaders()

      if (mode === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)

        fetchPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            ...apiHeaders,
          },
          body: formData,
        })
      } else {
        fetchPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...apiHeaders,
          },
          body: JSON.stringify({ url }),
        })
      }

      toast.promise(
        fetchPromise.then((response) => {
          if (!response.ok) {
            throw new Error('Upload failed')
          }

          // Clear form data on success
          setFile(null)
          setUrl('')
          return response.json()
        }),
        {
          loading: 'Processing through Chunkr...',
          success: (data) => {
            setUploading(false)
            return (
              <div className="gap-2">
                <p>File processed successfully!</p>
                <a href={`/chat/${data.task_id}`} className="underline">
                  Click here
                </a>
              </div>
            )
          },
          error: (err) => {
            console.error(`Error uploading ${mode}:`, err)
            setUploading(false)
            return `Failed to upload ${mode}`
          },
        }
      )
    } catch (error) {
      console.error('Error in upload process:', error)
      toast.error('Failed to upload')
      setUploading(false)
    }
  }

  const isFormValid = mode === 'file' ? file : url && !urlError

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          checked={mode === 'url'}
          onCheckedChange={(checked) =>
            handleModeChange(checked ? 'url' : 'file')
          }
        />
      </div>

      {/* Upload Form */}
      <form
        id="upload-form"
        onSubmit={handleSubmit}
        className="flex flex-row items-end h-fit gap-2"
      >
        <div>
          {mode === 'file' ? (
            // File Upload Section
            file ? (
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm text-gray-600 truncate">
                    {file.name.slice(0, 20)}...
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFileSelection}
                    size="icon"
                    className="shadow-none"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <label className="inline-block">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,application/pdf"
                    id="file-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer font-normal"
                    onClick={() =>
                      document.getElementById('file-input')?.click()
                    }
                  >
                    Browse Files
                  </Button>
                </label>
              </div>
            )
          ) : (
            <Input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="Enter a url"
              className={urlError ? 'border-destructive' : ''}
            />
          )}
        </div>

        <Button type="submit" disabled={uploading || !isFormValid} size={'sm'}>
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing
            </>
          ) : (
            'Upload'
          )}
        </Button>
      </form>
    </div>
  )
}

export default Upload

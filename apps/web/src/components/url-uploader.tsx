'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// URL schema validation
const urlSchema = z.string().url('Please enter a valid URL')

const UrlUpload = () => {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!url || !validateUrl(url)) return

    setUploading(true)

    try {
      const fetchPromise = fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        }
      )

      toast.promise(
        fetchPromise.then((response) => {
          if (!response.ok) {
            throw new Error('Upload failed')
          }

          setUrl('')
          return response.json()
        }),
        {
          loading: 'Uploading...',
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
            console.error('Error uploading URL:', err)
            setUploading(false)
            return 'Failed to upload URL'
          },
        }
      )
    } catch (error) {
      console.error('Error in upload process:', error)
      toast.error('Failed to upload URL')
      setUploading(false)
    }
  }

  return (
    <div className="p-6 bg-card border rounded-lg shadow-sm">
      <form id="url-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter PDF URL"
            className={urlError ? 'border-red-500' : ''}
          />
          {urlError && <p className="text-red-500 text-sm mt-1">{urlError}</p>}
        </div>
        <Button
          type="submit"
          disabled={uploading || !url || Boolean(urlError)}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </form>
    </div>
  )
}

export default UrlUpload

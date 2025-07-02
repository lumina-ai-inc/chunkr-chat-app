'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Upload as UploadIcon, X } from 'lucide-react'
import { getApiHeaders, validateApiKeys } from '@/helpers/api-keys'

// URL schema validation
const urlSchema = z.string().url('Please enter a valid url')

// Supported file types
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'image/jpeg',
  'image/jpg',
  'image/png',
]

const SUPPORTED_EXTENSIONS =
  '.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.jpeg,.jpg,.png'

const Upload = () => {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (selectedFile: File) => {
    if (!SUPPORTED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error('Please select a supported file type')
      return
    }
    setFile(selectedFile)
    setUrl('') // Clear URL when file is selected
    setUrlError(null)
  }

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFileChange(e.target.files[0])
    }
  }

  const clearFileSelection = () => {
    setFile(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (uploading) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleFileChange(droppedFiles[0])
    }
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
      setFile(null) // Clear file when URL is entered
    } else {
      setUrlError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file && (!url || !validateUrl(url))) return

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

      if (file) {
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
          error: () => {
            setUploading(false)
            return 'Failed to upload'
          },
        }
      )
    } catch (error) {
      console.error('Error in upload process:', error)
      toast.error('Failed to upload')
      setUploading(false)
    }
  }

  const isFormValid = file || (url && !urlError)

  return (
    <div className="space-y-6">
      <form id="upload-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {file ? (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <UploadIcon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-foreground truncate">
                    {file.name}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFileSelection}
                  size="icon"
                  className="shadow-none h-6 w-6"
                  disabled={uploading}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() =>
                !uploading && document.getElementById('file-input')?.click()
              }
            >
              <input
                type="file"
                className="hidden"
                onChange={handleInputFileChange}
                accept={SUPPORTED_EXTENSIONS}
                id="file-input"
                disabled={uploading}
              />
              <div className="space-y-2">
                <UploadIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, JPEG, JPG,
                    PNG
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-foreground font-medium">
              OR
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="Enter a URL"
                className={urlError ? 'border-destructive' : ''}
                disabled={uploading}
              />
              {urlError && (
                <p className="text-xs text-destructive mt-1">{urlError}</p>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={uploading || !isFormValid}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
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

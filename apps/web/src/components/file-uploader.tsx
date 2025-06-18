'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const fetchPromise = fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      toast.promise(
        fetchPromise.then((response) => {
          if (!response.ok) {
            throw new Error('Upload failed')
          }

          setFile(null)
          return response.json()
        }),
        {
          loading: 'Uploading file...',
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
            console.error('Error uploading file:', err)
            setUploading(false)
            return 'Failed to upload file'
          },
        }
      )
    } catch (error) {
      console.error('Error in upload process:', error)
      toast.error('Failed to upload file')
      setUploading(false)
    }
  }

  return (
    <div className="p-6 bg-card border rounded-lg shadow-sm">
      <form id="file-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {file ? (
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 truncate">{file.name}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFileSelection}
                  size="sm"
                >
                  Clear
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
                  className="cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Browse Files
                </Button>
              </label>
            </div>
          )}
          <Button
            type="submit"
            disabled={uploading || !file}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default FileUpload

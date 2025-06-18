'use client'

import { ModeToggle } from '@/components/ui/mode-toggle'
import UrlUpload from '@/components/url-uploader'
import FileUpload from '@/components/file-uploader'

export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        <UrlUpload />
        <FileUpload />
        <ModeToggle />
      </div>
    </div>
  )
}

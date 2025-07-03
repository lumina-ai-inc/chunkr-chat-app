'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, memo } from 'react'
import { useParams } from 'next/navigation'
import PDFChat from '@/components/chat/pdf-chat'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { ResizeHandle } from '@/components/ui/resizable-handle'
import { toast } from 'sonner'
import { Chunk, TaskResponse } from '@/client'
import { Button } from '@/components/ui/button'
import { FileText, X } from 'lucide-react'
import { getApiHeaders, validateApiKeys } from '@/helpers/api-keys'

const PDF = dynamic(() => import('@/components/chat/pdf-viewer'), {
  ssr: false,
})
const MemoizedPDF = memo(PDF)

export default function PDFPage() {
  const [chunks, setChunks] = useState<Chunk[]>([])
  const params = useParams()
  const taskId = params.task as string
  const [url, setUrl] = useState<string>('')
  const [showPdfMobile, setShowPdfMobile] = useState(false)

  useEffect(() => {
    const fetchPdfInfo = async () => {
      try {
        const { isValid, missingKeys } = validateApiKeys()
        if (!isValid) {
          toast.error(
            `Missing API keys: ${missingKeys.join(', ')}. Please configure them first.`
          )
          return
        }

        const apiHeaders = getApiHeaders()
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/task/${taskId}`,
          {
            method: 'GET',
            headers: {
              ...apiHeaders,
            },
          }
        )
        const data = await res.json()
        const task: TaskResponse = data.task
        const chunks: Chunk[] = task.output?.chunks || []

        setUrl(task.output?.pdf_url || '')
        setChunks(chunks)
      } catch (error) {
        toast.error('Error fetching info for task')
        console.error('Error fetching info for task:', error)
      }
    }
    fetchPdfInfo()
  }, [taskId])

  return (
    <>
      <div className="h-screen w-full md:hidden relative">
        <PDFChat taskId={taskId} />
        <Button
          className="fixed top-4 left-4 z-50"
          size="icon"
          onClick={() => setShowPdfMobile(!showPdfMobile)}
        >
          {showPdfMobile ? <X /> : <FileText />}
        </Button>
        {showPdfMobile && (
          <div className="fixed inset-0 bg-background z-40">
            <MemoizedPDF url={url} chunks={chunks} />
          </div>
        )}
      </div>
      <div className="hidden md:block h-screen">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={50} minSize={20}>
            <MemoizedPDF url={url} chunks={chunks} />
          </Panel>
          <ResizeHandle />
          <Panel defaultSize={50} minSize={20}>
            <PDFChat taskId={taskId} />
          </Panel>
        </PanelGroup>
      </div>
    </>
  )
}

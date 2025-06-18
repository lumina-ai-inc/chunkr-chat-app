'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { usePDFViewer } from '@/hooks/use-pdf-viewer'
import { BoundingBox, Chunk } from '@/client'
import BoundingBoxDisplay from '@/components/chat/bounding-box-display'
import Loader from '@/components/loader'
import { debounce } from 'lodash'

// Configure PDF.js worker source for rendering PDFs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

/**
 * PDFViewerComponent - A React component for rendering PDF documents with interactive bounding boxes
 *
 * This component provides:
 * - PDF document rendering with react-pdf
 * - Responsive page sizing based on container width
 * - Bounding box overlays for document chunks/segments
 * - Scroll synchronization and page navigation
 * - Loading states and error handling
 *
 * @param url - The URL or file path of the PDF document to display
 * @param chunks - Array of document chunks containing segments with bounding box data
 */
function PDFViewerComponent({ url, chunks }: { url: string; chunks: Chunk[] }) {
  // PDF document state
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageWidth, setPageWidth] = useState<number>(0) // Current calculated page width
  const [displayPageWidth, setDisplayPageWidth] = useState<number>(0) // Debounced width for rendering
  const [error, setError] = useState(false)
  const [isDocumentLoading, setIsDocumentLoading] = useState(true)

  // Refs for DOM elements and page tracking
  const containerRef = useRef<HTMLDivElement>(null) // Main container for resize observation
  const scrollContainerRef = useRef<HTMLDivElement>(null) // Scrollable container
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({}) // Individual page references

  const bboxes = useMemo(() => {
    const allBboxes: Array<{
      bbox: BoundingBox & { page_number: number }
      id: string
      page_width: number
      page_height: number
    }> = []

    chunks.forEach((chunk) => {
      // const chunkId = chunk.chunk_id || '' // if you want to do chunk_level citations
      chunk.segments.forEach((segment) => {
        allBboxes.push({
          bbox: {
            ...segment.bbox,
            page_number: segment.page_number,
          },
          id: segment.segment_id,
          page_width: segment.page_width,
          page_height: segment.page_height,
        })
      })
    })
    return allBboxes
  }, [chunks])

  // Custom hook for PDF viewer functionality (scroll sync, highlighting, etc.)
  usePDFViewer({
    bboxes,
    scrollContainerRef,
    pageRefs,
  })

  const debouncedSetPdfWidth = useMemo(
    () =>
      debounce((width: number) => {
        setDisplayPageWidth(width)
      }, 200),
    []
  )

  useEffect(() => {
    if (pageWidth > 0 && displayPageWidth === 0) {
      setDisplayPageWidth(pageWidth)
    }
  }, [pageWidth, displayPageWidth])

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages)
      setError(false)
      setIsDocumentLoading(false)
    },
    []
  )

  const onDocumentLoadError = useCallback((error: Error) => {
    setError(true)
    setIsDocumentLoading(false)
    console.error('Error loading PDF:', error)
  }, [])

  useEffect(() => {
    const observedContainer = containerRef.current
    if (!observedContainer) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Calculate new width with padding (32px) and minimum width (200px)
        const width = Math.max(Math.round(entry.contentRect.width - 32), 200)
        if (width !== pageWidth) {
          setPageWidth(width)
          debouncedSetPdfWidth(width)
        }
      }
    })

    resizeObserver.observe(observedContainer)
    return () => {
      debouncedSetPdfWidth.cancel()
      resizeObserver.disconnect()
    }
  }, [debouncedSetPdfWidth, containerRef, pageWidth, displayPageWidth])

  const MemoizedPage = React.memo(function MemoizedPage({
    pageNumber,
    pageWidth,
  }: {
    pageNumber: number
    pageWidth: number
  }) {
    return (
      <div
        className="relative"
        data-page-number={pageNumber}
        ref={(el) => {
          pageRefs.current[pageNumber] = el
        }}
      >
        <Page
          pageNumber={pageNumber}
          renderTextLayer={false} // Disabled for performance
          renderAnnotationLayer={false} // Disabled for performance
          width={pageWidth}
          loading={''}
        />
      </div>
    )
  })

  const pages = useMemo(() => {
    if (!numPages || displayPageWidth === 0) return null
    return Array.from({ length: numPages }, (_, index) => (
      <MemoizedPage
        key={index + 1}
        pageNumber={index + 1}
        pageWidth={displayPageWidth}
      />
    ))
  }, [numPages, displayPageWidth])

  const shouldShowLoader = isDocumentLoading || error

  return (
    <div
      className="relative h-full w-full max-w-full pdf-container"
      ref={containerRef}
    >
      {shouldShowLoader && (
        <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center bg-background">
          <Loader />
        </div>
      )}

      <div
        className="h-full overflow-auto flex flex-col items-center min-w-[200px] box-border"
        ref={scrollContainerRef}
      >
        <div className="flex flex-col items-center justify-start relative">
          <Document
            noData={<Loader />}
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="flex flex-col items-center"
            loading={<Loader />}
          >
            {pages}
          </Document>

          <BoundingBoxDisplay chunks={chunks} />
        </div>
      </div>
    </div>
  )
}

export default React.memo(PDFViewerComponent)

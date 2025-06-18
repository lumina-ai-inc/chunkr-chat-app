'use client'

import { useResponseStore } from '@/store/response-store'
import { Chunk, SegmentType, BoundingBox } from '@/client'
import { useMemo, useState, useCallback } from 'react'
import { getSegmentTypeColors } from '@/helpers/bounding-box-colors'
import { Label } from '@/components/ui/label'

export default function BoundingBoxDisplay({ chunks }: { chunks: Chunk[] }) {
  const hoveredChunkId = useResponseStore((state) => state.hoveredChunkId)
  const showAllBboxes = useResponseStore((state) => state.showAllBboxes)
  const [hoveredBboxIndex, setHoveredBboxIndex] = useState<number | null>(null)
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null)

  const bboxes = useMemo(() => {
    const allBboxes: Array<{
      bbox: BoundingBox & { page_number: number }
      id: string
      page_width: number
      page_height: number
      segment_type: SegmentType
    }> = []
    chunks.forEach((chunk) => {
      // const chunkId = chunk.chunk_id || '' // if you want to do chunk_level citations
      chunk.segments.forEach((segment) => {
        allBboxes.push({
          bbox: {
            top: segment.bbox.top,
            left: segment.bbox.left,
            width: segment.bbox.width,
            height: segment.bbox.height,
            page_number: segment.page_number,
          },
          id: segment.segment_id,
          page_width: segment.page_width,
          page_height: segment.page_height,
          segment_type: segment.segment_type,
        })
      })
    })
    return allBboxes
  }, [chunks])

  const visibleBboxes = useMemo(() => {
    if (showAllBboxes) {
      return bboxes
    }
    return bboxes.filter((box) => {
      if (!hoveredChunkId) return false
      return box.id === hoveredChunkId
    })
  }, [bboxes, hoveredChunkId, showAllBboxes])

  const getBoundingBoxStyle = useCallback((box: (typeof bboxes)[0]) => {
    const pageNumber = box.bbox.page_number
    const originalPageWidth = box.page_width
    const originalPageHeight = box.page_height

    // Find the page element to get its position and dimensions
    const pageElement = document.querySelector(
      `[data-page-number="${pageNumber}"]`
    ) as HTMLElement
    if (!pageElement) return null

    const pageRect = pageElement.getBoundingClientRect()
    const containerRect = pageElement
      .closest('.flex.flex-col.items-center.justify-start')
      ?.getBoundingClientRect()

    if (!containerRect) return null

    // Calculate the relative position within the container
    const relativeTop = pageRect.top - containerRect.top
    const relativeLeft = pageRect.left - containerRect.left

    // Calculate the scaled dimensions
    const scaleX = pageRect.width / originalPageWidth
    const scaleY = pageRect.height / originalPageHeight

    return {
      width: `${box.bbox.width * scaleX}px`,
      height: `${box.bbox.height * scaleY}px`,
      left: `${relativeLeft + box.bbox.left * scaleX}px`,
      top: `${relativeTop + box.bbox.top * scaleY}px`,
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {visibleBboxes.map((box, index) => {
        const colors = getSegmentTypeColors(box.segment_type)
        const style = getBoundingBoxStyle(box)
        const boxKey = `${box.id}-${index}`
        const isHovered = hoveredBoxId === boxKey

        if (!style) return null

        return (
          <div
            key={boxKey}
            className="absolute border transition-opacity pointer-events-auto bg-transparent"
            style={{
              ...style,
              borderColor: colors.border,
              backgroundColor: isHovered
                ? `${colors.backgroundHover}20`
                : 'transparent',
              borderWidth: '1px',
            }}
            onMouseEnter={() => {
              setHoveredBboxIndex(index)
              setHoveredBoxId(boxKey)
            }}
            onMouseLeave={() => {
              setHoveredBboxIndex(null)
              setHoveredBoxId(null)
            }}
          >
            {hoveredBboxIndex === index && (
              <Label
                className="absolute -top-6 left-0 px-2 py-1 border text-xs rounded whitespace-nowrap z-10"
                style={{
                  backgroundColor: colors.background,
                  color: 'white',
                  borderColor: colors.backgroundHover,
                  borderWidth: '1px',
                }}
              >
                {box.segment_type}
              </Label>
            )}
          </div>
        )
      })}
    </div>
  )
}

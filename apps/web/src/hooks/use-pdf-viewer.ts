import { BoundingBox } from '@/client'
import { useCallback, useRef, useEffect } from 'react'
import { useResponseStore } from '@/store/response-store'

/**
 * Props for the usePDFViewer hook.
 *
 * @interface UsePDFViewerProps
 */
interface UsePDFViewerProps {
  /** Array of bounding box data with associated metadata */
  bboxes: Array<{
    /** Bounding box coordinates with page number */
    bbox: BoundingBox & { page_number: number }
    /** Unique identifier for the bounding box */
    id: string
    /** Original page width for scaling calculations */
    page_width: number
    /** Original page height for scaling calculations */
    page_height: number
  }>
  /** Reference to the scrollable container element */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  /** References to individual page elements, keyed by page number */
  pageRefs: React.RefObject<Record<number, HTMLDivElement | null>>
}

/**
 * Custom hook for managing PDF viewer functionality including scrolling and navigation.
 *
 * This hook provides intelligent scrolling behavior for PDF documents with bounding boxes.
 * It automatically scrolls to specific pages and positions based on hovered chunks,
 * with smooth animations and proper positioning calculations.
 *
 * Features:
 * - Automatic scrolling to pages when chunks are hovered
 * - Precise positioning within pages based on bounding box coordinates
 * - Debounced scrolling to prevent excessive scroll events
 * - Smooth scroll animations
 * - Cleanup of timeouts on unmount
 *
 * @param props - Configuration object containing bboxes, scroll container, and page references
 *
 * @returns Object containing utility functions:
 *   - scrollToPage: Function to manually scroll to a specific page number
 *
 * @example
 * ```typescript
 * const { scrollToPage } = usePDFViewer({
 *   bboxes: documentBboxes,
 *   scrollContainerRef: containerRef,
 *   pageRefs: pagesRef
 * });
 *
 * // Manually scroll to page 3
 * scrollToPage(3);
 * ```
 */
export function usePDFViewer({
  bboxes,
  scrollContainerRef,
  pageRefs,
}: UsePDFViewerProps) {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Scrolls to a specific page with optional positioning based on hovered chunks.
   *
   * This function handles intelligent scrolling that considers:
   * - Whether there's a currently hovered chunk on the target page
   * - Precise positioning within the page based on bounding box coordinates
   * - Smooth scrolling animations with appropriate timing
   * - Fallback to basic page scrolling if no specific chunk is targeted
   *
   * @param pageNumber - The page number to scroll to (1-indexed)
   */
  const scrollToPage = useCallback(
    (pageNumber: number) => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (scrollContainerRef.current && pageRefs.current[pageNumber]) {
          const pageElement = pageRefs.current[pageNumber]
          if (pageElement) {
            const container = scrollContainerRef.current
            const containerRect = container.getBoundingClientRect()
            const pageRect = pageElement.getBoundingClientRect()

            const hoveredChunkId = useResponseStore.getState().hoveredChunkId
            const bbox = hoveredChunkId
              ? bboxes.find(
                  (box) =>
                    box.id === hoveredChunkId &&
                    box.bbox.page_number === pageNumber
                )
              : null

            if (bbox) {
              const originalPageHeight = bbox.page_height
              const relativePosition = bbox.bbox.top / originalPageHeight
              const offsetInPage = pageRect.height * relativePosition
              const targetScrollTop =
                pageElement.offsetTop +
                offsetInPage -
                containerRect.height * 0.1

              container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth',
              })
            } else if (
              pageRect.top < containerRect.top ||
              pageRect.bottom > containerRect.bottom
            ) {
              pageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
              })
            }
          }
        }
      }, 300)
    },
    [scrollContainerRef, pageRefs, bboxes]
  )

  const hoveredChunkId = useResponseStore((state) => state.hoveredChunkId)

  // Effect to automatically scroll when a chunk is hovered
  useEffect(() => {
    if (!hoveredChunkId) return

    const target = bboxes.find((box) => box.id === hoveredChunkId)
    const page = target?.bbox.page_number
    if (page != null) {
      scrollToPage(page)
    }
  }, [hoveredChunkId, bboxes, scrollToPage])

  // Cleanup effect to clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return { scrollToPage }
}

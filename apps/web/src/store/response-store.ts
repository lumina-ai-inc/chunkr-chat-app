import { create } from 'zustand'

/**
 * Metadata associated with assistant responses.
 *
 * @interface AssistantResponseMetadata
 */
interface AssistantResponseMetadata {
  /** Array of citation strings from the response */
  citations: string[]
  /** Array of image URLs from the response */
  images: string[]
}

/**
 * Global state store for managing response-related data and UI interactions.
 *
 * This store manages the state for:
 * - Chunk hovering interactions in the PDF viewer
 * - Response metadata including citations and images
 * - Bounding box visibility controls
 *
 * @interface ResponseStore
 */
interface ResponseStore {
  /** Currently hovered chunk ID, null if no chunk is hovered */
  hoveredChunkId: string | null
  /** Metadata from the latest assistant response */
  metadata: AssistantResponseMetadata
  /** Whether to show all bounding boxes or only relevant ones */
  showAllBboxes: boolean

  /**
   * Updates the response metadata with new citations and images.
   *
   * @param metadata - New metadata to set
   */
  setMetadata: (metadata: AssistantResponseMetadata) => void

  /**
   * Sets the currently hovered chunk ID for PDF viewer interactions.
   *
   * @param id - Chunk ID to set as hovered, or null to clear
   */
  setHoveredChunkId: (id: string | null) => void

  /**
   * Toggles the visibility of all bounding boxes in the PDF viewer.
   *
   * @param showAll - Whether to show all bounding boxes
   */
  setShowAllBboxes: (showAll: boolean) => void
}

/**
 * Zustand store for managing global response state.
 *
 * This store provides centralized state management for PDF viewer interactions,
 * response metadata, and UI controls. It's designed to be used across multiple
 * components that need to share response-related state.
 *
 * @example
 * ```typescript
 * // Access store state
 * const hoveredChunkId = useResponseStore(state => state.hoveredChunkId);
 * const metadata = useResponseStore(state => state.metadata);
 *
 * // Update store state
 * const setHoveredChunkId = useResponseStore(state => state.setHoveredChunkId);
 * setHoveredChunkId('chunk-123');
 *
 * // Access store outside React components
 * const currentState = useResponseStore.getState();
 * ```
 */
export const useResponseStore = create<ResponseStore>((set) => {
  return {
    hoveredChunkId: null,
    metadata: {
      citations: [],
      images: [],
    },
    showAllBboxes: false,
    setMetadata: (metadata) => set({ metadata }),
    setHoveredChunkId: (id) => {
      if (id) {
        set({ hoveredChunkId: id })
      } else {
        set({ hoveredChunkId: null })
      }
    },
    setShowAllBboxes: (showAll) => set({ showAllBboxes: showAll }),
  }
})

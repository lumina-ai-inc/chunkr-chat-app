import { SegmentType } from '@/client'

/**
 * Color configuration for segment type styling.
 *
 * @interface SegmentColors
 */
interface SegmentColors {
  /** Border color in hex format */
  border: string
  /** Background color in hex format */
  background: string
  /** Background color on hover in hex format */
  backgroundHover: string
}

/**
 * Returns color configuration for different segment types used in document visualization.
 *
 * This function maps document segment types to their corresponding color schemes
 * for consistent visual representation across the application. Each segment type
 * has distinct colors for borders, backgrounds, and hover states.
 *
 * @param segmentType - The type of document segment (case-insensitive)
 *
 * @returns Color configuration object containing border, background, and hover colors
 *
 * @example
 * ```typescript
 * const colors = getSegmentTypeColors('text');
 * console.log(colors.border); // '#10b981' (emerald-500)
 *
 * const tableColors = getSegmentTypeColors('TABLE'); // Case-insensitive
 * console.log(tableColors.background); // '#f97316' (orange-500)
 * ```
 *
 * Supported segment types:
 * - 'text': Emerald colors for regular text content
 * - 'table': Orange colors for tabular data
 * - 'title': Blue colors for document titles
 * - 'picture': Pink colors for images and pictures
 * - 'formula': Amber colors for mathematical formulas
 * - 'caption': Red colors for image/table captions
 * - 'footnote': Pink colors for footnotes
 * - 'listitem': Dark amber colors for list items
 * - 'pagefooter': Dark red colors for page footers
 * - 'pageheader': Violet colors for page headers
 * - 'sectionheader': Cyan colors for section headers
 * - 'page': Gray colors for page boundaries
 * - Default: Blue colors for unknown segment types
 */
export function getSegmentTypeColors(segmentType: SegmentType): SegmentColors {
  switch (segmentType.toLowerCase()) {
    case 'text':
      return {
        border: '#10b981', // emerald-500
        background: '#10b981',
        backgroundHover: '#059669', // emerald-600
      }
    case 'table':
      return {
        border: '#f97316', // orange-500
        background: '#f97316',
        backgroundHover: '#ea580c', // orange-600
      }
    case 'title':
      return {
        border: '#3b82f6', // blue-500
        background: '#3b82f6',
        backgroundHover: '#2563eb', // blue-600
      }
    case 'picture':
      return {
        border: '#ec4899', // pink-500
        background: '#ec4899',
        backgroundHover: '#db2777', // pink-600
      }
    case 'formula':
      return {
        border: '#f59e0b', // amber-500
        background: '#f59e0b',
        backgroundHover: '#d97706', // amber-600
      }
    case 'caption':
      return {
        border: '#ef4444', // red-500
        background: '#ef4444',
        backgroundHover: '#dc2626', // red-600
      }
    case 'footnote':
      return {
        border: '#ec4899', // pink-500
        background: '#ec4899',
        backgroundHover: '#db2777', // pink-600
      }
    case 'listitem':
      return {
        border: '#b45309', // amber-700
        background: '#b45309',
        backgroundHover: '#92400e', // amber-800
      }
    case 'pagefooter':
      return {
        border: '#b91c1c', // red-700
        background: '#b91c1c',
        backgroundHover: '#991b1b', // red-800
      }
    case 'pageheader':
      return {
        border: '#8b5cf6', // violet-500
        background: '#8b5cf6',
        backgroundHover: '#7c3aed', // violet-600
      }
    case 'sectionheader':
      return {
        border: '#06b6d4', // cyan-500
        background: '#06b6d4',
        backgroundHover: '#0891b2', // cyan-600
      }
    case 'page':
      return {
        border: '#6b7280', // gray-500
        background: '#6b7280',
        backgroundHover: '#4b5563', // gray-600
      }
    default:
      return {
        border: '#3b82f6', // blue-500
        background: '#3b82f6',
        backgroundHover: '#2563eb', // blue-600
      }
  }
}

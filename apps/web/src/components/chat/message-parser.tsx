import React from 'react'
import ReactMarkdown from 'react-markdown'
import Citation from '@/components/chat/citation'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import TableWrapper from '@/components/chat/table-wrapper'

/**
 * Parses and renders markdown content with custom components and citation handling.
 *
 * This function processes markdown content by:
 * - Converting citation patterns (e.g., [1], [1,2,3]) into inline code for special handling
 * - Rendering markdown with support for math equations, GitHub-flavored markdown, and tables
 * - Converting citation code blocks into clickable Citation components
 * - Applying custom styling to various markdown elements
 *
 * @param content - The raw markdown content string to be parsed and rendered
 * @returns A React element containing the rendered markdown with custom components
 */
export function parseMessageContent(content: string) {
  const processedContent = content.replace(/(\[\d+(?:,\s*\d+)*\])/g, '`$1`')

  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => (
            <p className="whitespace-pre-wrap">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ml-4 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-4 my-2">{children}</ol>
          ),
          li: ({ children }) => <li className="my-1">{children}</li>,
          em: ({ children }) => <em className="font-medium">{children}</em>,
          table: ({ children }) => (
            <TableWrapper>
              <table>{children}</table>
            </TableWrapper>
          ),
          code({ className, children, ...props }) {
            const value = React.Children.toArray(children)
              .map((child) => (typeof child === 'string' ? child : ''))
              .join('')
              .replace(/\n$/, '')

            const citationMatch = value.match(/^\[(\d+(?:,\s*\d+)*)\]$/)
            if (citationMatch) {
              const numbers = citationMatch[1]
                .split(',')
                .map((num) => parseInt(num.trim(), 10))
              return (
                <span>
                  {numbers.map((num, index) => (
                    <React.Fragment key={num}>
                      <Citation count={num} />
                      {index < numbers.length - 1 && ' '}
                    </React.Fragment>
                  ))}
                </span>
              )
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

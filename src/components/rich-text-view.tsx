/**
 * Render sanitized rich text HTML anywhere it's displayed (list rows, admin
 * views, proceedings export). Runs the same sanitizer that save-path uses,
 * so this is safe even if a bad row slipped in past the write-side check.
 *
 * Two variants:
 *   - <RichTextView html={...} />        // block-level, wraps paragraphs
 *   - <RichTextView html={...} inline /> // strips outer <p> for use in cells / headings
 *
 * If you're using this in a table cell or headline where paragraph wrapping
 * would break layout, pass `inline`. TipTap always wraps in <p>, and browsers
 * add block-level margin, which looks wrong inside a title.
 */

import { sanitizeRichTextHtml } from '@/lib/rich-text'

export type RichTextViewProps = {
  html: string | null | undefined
  className?: string
  /** Strip outer <p> wrapper so this renders inline (for table cells, headings). */
  inline?: boolean
  /** Rendered when html is empty. Defaults to nothing. */
  fallback?: React.ReactNode
}

export function RichTextView({
  html,
  className,
  inline = false,
  fallback = null,
}: RichTextViewProps) {
  const clean = sanitizeRichTextHtml(html)
  if (!clean) return <>{fallback}</>

  const displayHtml = inline ? clean.replace(/<\/?p>/g, '').replace(/<br\s*\/?>/gi, ' ') : clean

  const Tag = inline ? 'span' : 'div'
  // The prose-abstract class in globals.css restores italic/sup/sub styling
  // that Tailwind's Preflight would otherwise flatten.
  const merged = ['prose-abstract', className].filter(Boolean).join(' ')
  return (
    <Tag
      className={merged}
      // Sanitized above — DOMPurify strips everything not on our tag allowlist.
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  )
}

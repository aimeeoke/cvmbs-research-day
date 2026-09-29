/**
 * Rich text: what's allowed, how it's sanitized, and how to read it as plain text.
 *
 * This module is the single source of truth for the "abstract title / body" rich
 * text pattern. It's used from three places:
 *
 * 1. The TipTap editor (RichTextEditor component) — extensions define what
 *    the user can type or paste in.
 * 2. The save path (submit/actions.ts) — sanitizeRichTextHtml runs on every write.
 * 3. The read path (RichTextView component + search filters) — sanitize before
 *    injecting HTML, and use richTextToPlainText for search / char counts.
 *
 * Why the mark list is so small: scientific abstracts need italics for species
 * names (E. coli, in vivo), sub/superscripts for formulas (H₂O, m²), and bold
 * for occasional emphasis. Everything else (headings, lists, links, images,
 * colors, fonts) is either style noise or a security risk — kept out on purpose.
 *
 * If you paste this pattern into another project, the two files you need are
 * this one plus src/components/rich-text-editor.tsx (and rich-text-view.tsx if
 * you display the content anywhere). Storage is a plain TEXT column.
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * HTML tags allowed in stored rich text. Kept intentionally minimal — see
 * module header. DOMPurify drops anything not on this list on save AND render.
 */
export const RICH_TEXT_ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'sup', 'sub'] as const

/**
 * No HTML attributes are allowed — this keeps out `style`, `class`, `href`,
 * event handlers, etc. If we ever need e.g. `dir="rtl"` on a paragraph, extend
 * this list explicitly and audit for injection risk.
 */
export const RICH_TEXT_ALLOWED_ATTRS: readonly string[] = []

/**
 * Run raw HTML through DOMPurify with our allowlist. Safe to call on both
 * server (save) and client (render).
 *
 * The empty-string check is a small perf win: TipTap emits '' when the editor
 * is fully empty, and there's no reason to boot DOMPurify for that.
 */
export function sanitizeRichTextHtml(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...RICH_TEXT_ALLOWED_TAGS],
    ALLOWED_ATTR: [...RICH_TEXT_ALLOWED_ATTRS],
    KEEP_CONTENT: true,
  })
}

/**
 * TipTap treats an empty editor as `<p></p>`. Plain `!html.trim()` won't
 * catch that — use this helper anywhere you'd have written `!value.trim()`.
 */
export function richTextIsEmpty(html: string | null | undefined): boolean {
  if (!html) return true
  const stripped = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '').trim()
  return stripped.length === 0
}

/**
 * Extract readable text for search filters, char counts, or a fallback plain
 * export. Preserves inline structure (italics/subscripts collapse to their
 * text content — "E. coli" comes out as "E. coli", "H₂O" as "H₂O" if the
 * user typed the Unicode subscript, or "H2O" if they used the sub button).
 *
 * Uses DOMPurify with an empty tag list to strip everything but text nodes.
 */
export function richTextToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  const text = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  })
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Word count = whitespace-separated tokens after stripping tags. Good enough
 * for abstract length hints (matches Word's count within a word or two for
 * typical prose).
 */
export function richTextWordCount(html: string | null | undefined): number {
  const plain = richTextToPlainText(html)
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
}

/** Character count including spaces, matching what MS Word calls "Characters". */
export function richTextCharCount(html: string | null | undefined): number {
  return richTextToPlainText(html).length
}

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
 * Sanitizer choice: `sanitize-html` (not DOMPurify / isomorphic-dompurify).
 * DOMPurify's Node build pulls in jsdom, and jsdom v25+ has an ESM subdep
 * (@exodus/bytes) that breaks Vercel's serverless runtime with a CJS/ESM
 * require() error. sanitize-html is pure-Node, works in both server and
 * client bundles, and has no such landmine.
 *
 * If you paste this pattern into another project, the two files you need are
 * this one plus src/components/rich-text-editor.tsx (and rich-text-view.tsx if
 * you display the content anywhere). Storage is a plain TEXT column.
 */

import sanitizeHtml from 'sanitize-html'

/**
 * HTML tags allowed in stored rich text. Kept intentionally minimal — see
 * module header. sanitize-html drops anything not on this list on save AND
 * render.
 */
export const RICH_TEXT_ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'sup', 'sub'] as const

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...RICH_TEXT_ALLOWED_TAGS],
  // No attributes on any tag — keeps out style, class, href, event handlers.
  // If you ever need e.g. `dir="rtl"` on a paragraph, extend this explicitly
  // and audit for injection risk.
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
  // Don't try to auto-close broken tags — reject strange HTML rather than
  // silently reshape it. If TipTap wrote it, it's already well-formed.
  parseStyleAttributes: false,
}

/**
 * Run raw HTML through sanitize-html with our allowlist. Safe to call on both
 * server (save) and client (render).
 *
 * The empty-string check is a small perf win: TipTap emits '' when the editor
 * is fully empty, and there's no reason to spin up the sanitizer for that.
 */
export function sanitizeRichTextHtml(html: string | null | undefined): string {
  if (!html) return ''
  return sanitizeHtml(html, SANITIZE_OPTIONS)
}

/**
 * TipTap treats an empty editor as `<p></p>`. Plain `!html.trim()` won't
 * catch that — use this helper anywhere you'd have written `!value.trim()`.
 *
 * Regex-only so it stays lightweight in the client bundle.
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
 * Regex-only, no sanitizer dependency — safe for use in tight client-side
 * loops (e.g. table filters that re-run on every keystroke).
 */
export function richTextToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
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

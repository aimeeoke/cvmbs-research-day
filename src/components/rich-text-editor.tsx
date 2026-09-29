'use client'

/**
 * TipTap-backed rich text editor with a scientific-writing toolbar (bold,
 * italic, superscript, subscript). Emits sanitized HTML via onChange.
 *
 * Marks/nodes are whitelisted in src/lib/rich-text.ts — this component just
 * wires TipTap up to that policy. See the header of that file for the "why"
 * behind the small mark list.
 *
 * SSR note: `immediatelyRender: false` is required because we're inside a
 * client component that may hydrate. Otherwise TipTap renders on the server
 * with one DOM and the client with another, causing a hydration mismatch.
 * The null-editor guard below shows a skeleton until the client is ready.
 *
 * Usage:
 *   <RichTextEditor value={html} onChange={setHtml} placeholder="..." />
 *   <RichTextEditor value={html} onChange={setHtml} multiline={false} />  // one-liner (title)
 */

import { useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { Bold, Italic, Superscript as SupIcon, Subscript as SubIcon } from 'lucide-react'

export type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
  placeholder?: string
  /** If false, disables paragraphs and swallows Enter — good for single-line title fields. */
  multiline?: boolean
  minRows?: number
  className?: string
  /** Add an id so `<label htmlFor>` associations still work. */
  id?: string
  ariaLabel?: string
}

const CORE_EXTENSIONS = [
  StarterKit.configure({
    // Everything we don't want. Bold + Italic + HardBreak + Paragraph stay on.
    blockquote: false,
    bulletList: false,
    codeBlock: false,
    code: false,
    heading: false,
    horizontalRule: false,
    listItem: false,
    listKeymap: false,
    link: false,
    orderedList: false,
    strike: false,
    underline: false,
    dropcursor: false,
    trailingNode: false,
    undoRedo: {},
  }),
  Superscript,
  Subscript,
]

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
  multiline = true,
  minRows = 8,
  className,
  id,
  ariaLabel,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: CORE_EXTENSIONS,
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': multiline ? 'true' : 'false',
        ...(id ? { id } : {}),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        class: [
          'prose-abstract',
          'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm',
          'focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]',
          multiline ? '' : 'whitespace-nowrap overflow-x-auto',
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white',
          className ?? '',
        ].join(' '),
        style: multiline ? `min-height: ${minRows * 1.5}rem` : '',
      },
      handleKeyDown: multiline
        ? undefined
        : (_view, event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              return true
            }
            return false
          },
      transformPastedHTML: (html) => html, // let TipTap's schema drop disallowed marks
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes into the editor (e.g. loading a draft).
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  // Track disabled prop.
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) {
    return (
      <div
        className={[
          'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-gray-50 text-gray-400',
          multiline ? '' : 'whitespace-nowrap overflow-hidden',
        ].join(' ')}
        style={multiline ? { minHeight: `${minRows * 1.5}rem` } : undefined}
      >
        {placeholder ?? ' '}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
      {placeholder && editor.isEmpty && (
        <p className="text-xs text-gray-400 -mt-0.5 pl-1 pointer-events-none">
          {placeholder}
        </p>
      )}
    </div>
  )
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const btn =
    'inline-flex items-center justify-center h-7 w-7 rounded border text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'
  const active = 'bg-[#1E4D2B]/10 border-[#1E4D2B]/30 text-[#1E4D2B]'
  const idle = 'border-gray-300 bg-white'

  return (
    <div
      className="flex items-center gap-1"
      role="toolbar"
      aria-label="Formatting"
    >
      <button
        type="button"
        title="Bold (Ctrl+B)"
        aria-label="Bold"
        aria-pressed={editor.isActive('bold')}
        disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btn} ${editor.isActive('bold') ? active : idle}`}
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        title="Italic (Ctrl+I)"
        aria-label="Italic"
        aria-pressed={editor.isActive('italic')}
        disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${btn} ${editor.isActive('italic') ? active : idle}`}
      >
        <Italic size={14} />
      </button>
      <button
        type="button"
        title="Superscript"
        aria-label="Superscript"
        aria-pressed={editor.isActive('superscript')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        className={`${btn} ${editor.isActive('superscript') ? active : idle}`}
      >
        <SupIcon size={14} />
      </button>
      <button
        type="button"
        title="Subscript"
        aria-label="Subscript"
        aria-pressed={editor.isActive('subscript')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        className={`${btn} ${editor.isActive('subscript') ? active : idle}`}
      >
        <SubIcon size={14} />
      </button>
      <span className="ml-1 text-[11px] text-gray-500">
        Pasting from Word keeps italics, sub/superscripts, and Greek letters.
      </span>
    </div>
  )
}

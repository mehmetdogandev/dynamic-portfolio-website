'use client'

import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'E-posta içeriğini buraya yazın...',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalUpdate = useRef(false)

  useEffect(() => {
    if (!editorRef.current) return

    if (editorRef.current.innerHTML !== value && !isInternalUpdate.current) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleChange()
  }

  const handleChange = () => {
    if (!editorRef.current) return
    isInternalUpdate.current = true
    onChange(editorRef.current.innerHTML)
    setTimeout(() => {
      isInternalUpdate.current = false
    }, 0)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    handleChange()
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt('Link URL:')
            if (url) execCommand('createLink', url)
          }}
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        onPaste={handlePaste}
        className={cn(
          'min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none dark:prose-invert',
          !value && 'text-gray-400'
        )}
        data-placeholder={placeholder}
        style={
          {
            // Placeholder styling via CSS
          }
        }
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

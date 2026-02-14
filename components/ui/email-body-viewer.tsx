'use client'

import { Code2, FileText, Globe } from 'lucide-react'
import { useMemo, useState } from 'react'

interface EmailBodyViewerProps {
  body: string | null
  bodyHtml: string | null
}

function sanitizeHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

export function EmailBodyViewer({ body, bodyHtml }: EmailBodyViewerProps) {
  const [mode, setMode] = useState<'html' | 'text'>(
    bodyHtml ? 'html' : 'text'
  )

  const safeHtml = useMemo(() => {
    if (!bodyHtml) return ''
    return sanitizeHtml(bodyHtml)
  }, [bodyHtml])

  const plain = (body || '').trim()

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          正文展示
        </div>
        <div className="flex items-center gap-2">
          {bodyHtml && (
            <button
              type="button"
              onClick={() => setMode('html')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                mode === 'html'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-secondary'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              HTML
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              mode === 'text'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:bg-secondary'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            纯文本
          </button>
        </div>
      </div>

      {mode === 'html' && bodyHtml ? (
        <div
          className="p-6 bg-background text-foreground leading-7 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_th]:border [&_td]:border-border [&_th]:border-border [&_td]:p-2 [&_th]:p-2 [&_a]:text-primary [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <pre className="p-6 whitespace-pre-wrap break-words font-sans text-sm leading-7 bg-background text-foreground">
          {plain || '(无正文内容)'}
        </pre>
      )}
    </div>
  )
}

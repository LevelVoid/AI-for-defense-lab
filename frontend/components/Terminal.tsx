'use client'

import { useEffect, useRef } from 'react'

export type TerminalLineType = 'info' | 'warn' | 'error' | 'success' | 'cmd' | 'system'

export interface TerminalLine {
  id: string
  text: string
  type: TerminalLineType
}

const LINE_COLORS: Record<TerminalLineType, string> = {
  cmd:     'text-matrix',
  success: 'text-emerald-400',
  error:   'text-red-400',
  warn:    'text-amber-400',
  info:    'text-slate-400',
  system:  'text-cyan-400',
}

const LINE_PREFIXES: Record<TerminalLineType, string> = {
  cmd:     '>_ ',
  success: '[OK]  ',
  error:   '[ERR] ',
  warn:    '[WRN] ',
  info:    '      ',
  system:  '[SYS] ',
}

interface TerminalProps {
  lines: TerminalLine[]
  title?: string
  className?: string
}

export default function Terminal({ lines, title, className = '' }: TerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <div className={`flex flex-col bg-panel border border-border rounded-sm overflow-hidden ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-[#080d12] shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-matrix/60" />
        {title && (
          <span className="ml-2 text-[10px] text-slate-600 tracking-widest uppercase select-none">
            {title}
          </span>
        )}
      </div>

      {/* Log body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs leading-[1.6] font-mono min-h-0">
        {lines.length === 0 ? (
          <span className="text-slate-700">— awaiting output —</span>
        ) : (
          lines.map((line) => (
            <div key={line.id} className={`whitespace-pre-wrap break-all ${LINE_COLORS[line.type]}`}>
              <span className="text-slate-700 select-none">{LINE_PREFIXES[line.type]}</span>
              {line.text}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Prompt row */}
      <div className="px-3 py-1.5 border-t border-border shrink-0 flex items-center gap-1">
        <span className="text-matrix text-xs select-none">›</span>
        <span className="inline-block w-[7px] h-3.5 bg-matrix animate-blink" />
      </div>
    </div>
  )
}

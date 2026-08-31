import Terminal from '@/components/Terminal'
import type { TerminalLine } from '@/components/Terminal'

const BOOT_LINES: TerminalLine[] = [
  { id: '1', type: 'system', text: 'Generator Studio initializing...' },
  { id: '2', type: 'info',   text: 'Loading attack surface registry (16 vectors)' },
  { id: '3', type: 'success',text: 'Surface 01: Protocol & Rail — 4 vectors loaded' },
  { id: '4', type: 'success',text: 'Surface 02: Endpoint & Auth — 4 vectors loaded' },
  { id: '5', type: 'success',text: 'Surface 03: Human & Social — 4 vectors loaded' },
  { id: '6', type: 'success',text: 'Surface 04: Post-Purchase & Dispute — 4 vectors loaded' },
  { id: '7', type: 'info',   text: 'Monaco editor module: pending (M4)' },
  { id: '8', type: 'info',   text: 'WebSocket client: pending (M4)' },
  { id: '9', type: 'warn',   text: 'Red-team payload synthesizer: offline' },
  { id: '10',type: 'system', text: 'Shell ready. Full studio wires up in M4.' },
]

export default function GeneratorStudio() {
  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-baseline justify-between shrink-0">
        <div>
          <h2 className="text-matrix text-sm font-semibold tracking-widest uppercase">
            Red-Team Generator
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Monaco editor + WebSocket stream — fully wired in M4
          </p>
        </div>
        <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded">
          OFFLINE
        </span>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Editor placeholder */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">Payload Editor</div>
          <div className="flex-1 bg-panel border border-border rounded-sm flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-slate-700 text-2xl">{ }</div>
              <p className="text-slate-600 text-xs">
                Monaco editor initializes in M4
              </p>
              <p className="text-slate-700 text-[10px] font-mono">
                @monaco-editor/react v4.6 ready to mount
              </p>
            </div>
          </div>
        </div>

        {/* Terminal output */}
        <div className="w-80 flex flex-col gap-2 min-h-0 shrink-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">Stream Output</div>
          <Terminal
            title="generator.log"
            lines={BOOT_LINES}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
}

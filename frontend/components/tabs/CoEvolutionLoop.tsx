import Terminal from '@/components/Terminal'
import type { TerminalLine } from '@/components/Terminal'

const EPOCHS = [
  { n: 1, evasion: 18.2, auc: 0.971, fpr: 0.089, event: 'Baseline — initial model deployment' },
  { n: 2, evasion: 34.7, auc: 0.952, fpr: 0.112, event: 'Red-team adapts; evasion spike detected' },
  { n: 3, evasion: 29.1, auc: 0.961, fpr: 0.097, event: 'Blue-team retrain triggered on new samples' },
  { n: 4, evasion: 21.3, auc: 0.974, fpr: 0.083, event: 'Evasion rate collapses post-retrain' },
  { n: 5, evasion: 15.8, auc: 0.981, fpr: 0.071, event: 'System hardened — new equilibrium' },
]

const LOOP_LOG: TerminalLine[] = [
  { id: '1', type: 'system',  text: 'Co-evolution engine initializing...' },
  { id: '2', type: 'info',    text: 'Red-team agent: 5-epoch simulation ready' },
  { id: '3', type: 'info',    text: 'Blue-team retrain scheduler: standby' },
  { id: '4', type: 'warn',    text: 'Live epoch chart: offline (M6)' },
  { id: '5', type: 'warn',    text: 'WebSocket epoch stream: offline (M6)' },
  { id: '6', type: 'success', text: 'Static epoch data loaded (5 epochs)' },
  { id: '7', type: 'system',  text: 'Live co-evolution loop wires up in M6.' },
]

export default function CoEvolutionLoop() {
  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-baseline justify-between shrink-0">
        <div>
          <h2 className="text-matrix text-sm font-semibold tracking-widest uppercase">
            Co-Evolution Loop
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Evasion chart + epoch simulation — fully wired in M6
          </p>
        </div>
        <span className="text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded">
          5 EPOCHS
        </span>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Epoch table + chart placeholder */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Chart placeholder */}
          <div className="h-32 bg-panel border border-border rounded-sm flex items-center justify-center shrink-0">
            <div className="text-center space-y-1">
              <div className="text-slate-700 text-2xl font-mono">∿</div>
              <p className="text-slate-600 text-xs">Recharts evasion / AUC time-series — M6</p>
            </div>
          </div>

          {/* Epoch table */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Epoch', 'Evasion %', 'AUC', 'FPR', 'Event'].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-[10px] text-slate-600 tracking-widest uppercase font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EPOCHS.map((ep) => {
                  const aucOk  = ep.auc  >= 0.97
                  const fprOk  = ep.fpr  <= 0.001
                  const evasionHigh = ep.evasion > 30
                  return (
                    <tr key={ep.n} className="border-b border-border/40 hover:bg-matrix/5 transition-colors">
                      <td className="py-2 pr-4 text-matrix font-semibold">E{ep.n}</td>
                      <td className={`py-2 pr-4 font-mono ${evasionHigh ? 'text-red-400' : 'text-amber-400'}`}>
                        {ep.evasion.toFixed(1)}%
                      </td>
                      <td className={`py-2 pr-4 font-mono ${aucOk ? 'text-matrix' : 'text-red-400'}`}>
                        {ep.auc.toFixed(3)}
                      </td>
                      <td className={`py-2 pr-4 font-mono ${fprOk ? 'text-matrix' : 'text-amber-400'}`}>
                        {(ep.fpr * 100).toFixed(2)}%
                      </td>
                      <td className="py-2 text-slate-500 text-[10px]">{ep.event}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loop log */}
        <div className="w-72 flex flex-col gap-2 min-h-0 shrink-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">Loop Log</div>
          <Terminal
            title="coevolution.log"
            lines={LOOP_LOG}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
}

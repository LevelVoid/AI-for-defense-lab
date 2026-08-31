import Terminal from '@/components/Terminal'
import type { TerminalLine } from '@/components/Terminal'

const STAT_TILES = [
  { label: 'AUC Target',  value: '≥ 0.97',  sub: 'ROC curve',         color: 'text-matrix',    border: 'border-matrix/30' },
  { label: 'FPR Ceiling', value: '< 0.1%',  sub: 'false positive rate', color: 'text-cyan-400',  border: 'border-cyan-500/30' },
  { label: 'Latency SLA', value: '< 100ms', sub: 'p99 inference',      color: 'text-amber-400', border: 'border-amber-500/30' },
  { label: 'Models',      value: '3',       sub: 'DeBERTa · XGBoost · GraphSAGE', color: 'text-slate-300', border: 'border-slate-600/40' },
]

const MODEL_LOG: TerminalLine[] = [
  { id: '1', type: 'system',  text: 'Blue-team defense stack initializing...' },
  { id: '2', type: 'info',    text: 'Layer 1 — DeBERTa-v3-base: model weights pending' },
  { id: '3', type: 'info',    text: 'Layer 2 — XGBoost tabular classifier: pending' },
  { id: '4', type: 'info',    text: 'Layer 3 — PyTorch GraphSAGE: pending' },
  { id: '5', type: 'warn',    text: 'SHAP explainability chart: offline (M5)' },
  { id: '6', type: 'warn',    text: 'Alert log stream: offline (M5)' },
  { id: '7', type: 'system',  text: 'Dashboard wires up fully in Milestone 5.' },
]

export default function DefenderDashboard() {
  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-baseline justify-between shrink-0">
        <div>
          <h2 className="text-matrix text-sm font-semibold tracking-widest uppercase">
            Blue-Team Defender
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            SHAP explainability + alert log — fully wired in M5
          </p>
        </div>
        <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded">
          STANDBY
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {STAT_TILES.map((tile) => (
          <div
            key={tile.label}
            className={`bg-panel border ${tile.border} rounded-sm px-4 py-3`}
          >
            <div className={`text-xl font-bold font-mono ${tile.color}`}>{tile.value}</div>
            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{tile.label}</div>
            <div className="text-[10px] text-slate-700 mt-0.5">{tile.sub}</div>
          </div>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* SHAP chart placeholder */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">SHAP Feature Importance</div>
          <div className="flex-1 bg-panel border border-border rounded-sm flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-slate-700 text-3xl font-mono">≋</div>
              <p className="text-slate-600 text-xs">Recharts SHAP bar chart — M5</p>
              <p className="text-slate-700 text-[10px]">DeBERTa · XGBoost · GraphSAGE layers</p>
            </div>
          </div>
        </div>

        {/* Model log */}
        <div className="w-72 flex flex-col gap-2 min-h-0 shrink-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">Model Log</div>
          <Terminal
            title="defender.log"
            lines={MODEL_LOG}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
}

export default function LabPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-panel px-6 py-3 flex items-center gap-3">
        <span className="text-matrix font-semibold text-sm tracking-widest uppercase">
          ▣ AI Defense Lab
        </span>
        <span className="text-muted text-xs">| Mastercard Innovation Challenge 2026</span>
      </header>

      <main className="flex-1 flex items-center justify-center text-muted text-sm">
        {/* Tab content rendered here — wired up in M2 */}
        <p>Lab shell initializing…</p>
      </main>
    </div>
  )
}

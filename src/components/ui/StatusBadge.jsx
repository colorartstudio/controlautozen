import { getStatusTone } from '../../utils/productFormatters'

const toneClasses = {
  amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  rose: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  slate: 'border-slate-400/20 bg-slate-500/10 text-slate-200',
}

export function StatusBadge({ children, status }) {
  const tone = getStatusTone(status ?? String(children ?? '').toLowerCase())

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

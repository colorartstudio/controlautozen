export function StatCard({ eyebrow, title, value, description }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
        {eyebrow}
      </p>
      <div className="mt-4 space-y-2">
        <p className="text-3xl font-semibold text-white">{value}</p>
        <h3 className="text-base font-medium text-slate-200">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </section>
  )
}

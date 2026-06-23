export function SectionCard({
  title,
  description,
  actions,
  children,
  className = '',
  contentClassName = '',
}) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur ${className}`.trim()}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? (
            <p className="max-w-2xl text-sm text-slate-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  )
}

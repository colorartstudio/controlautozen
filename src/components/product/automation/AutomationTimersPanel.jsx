import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import { formatCountdown } from '../../../utils/productFormatters'

export function AutomationTimersPanel({ activeTimers, isSubmitting, onEditTask }) {
  return (
    <SectionCard
      title="Timers ativos"
      description="Visao dos cronometros antes da fase do executor."
    >
      <div className="space-y-3">
        {activeTimers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
            Nenhum timer ativo ainda.
          </div>
        ) : (
          activeTimers.map((task) => (
            <div
              key={task.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{task.externalAccountName}</p>
                  <p className="mt-1 text-sm text-slate-400">{task.notes || 'Sem observacoes.'}</p>
                </div>
                <StatusBadge status={task.status}>{task.status}</StatusBadge>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
                <span>Proximo ciclo: {formatCountdown(task.nextRunAt)}</span>
                <span>Plus: ${task.plusAmount}</span>
                <span>3Hours acima de: ${task.minAvailableBalance}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  onClick={() => onEditTask(task)}
                >
                  Reeditar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  )
}

import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import { formatCountdown, formatDateTime } from '../../../utils/productFormatters'

const COMMAND_LABELS = {
  open_trade: 'Abrir trade',
  prepare_cycle: 'Preparar ciclo',
  validate_session: 'Validar sessao',
}

function getLatestCommand(commandByTaskId, taskId) {
  return commandByTaskId[taskId] ?? null
}

export function AutomationActivityPanel({
  accountById,
  commandByTaskId,
  isSubmitting,
  logs,
  onDeleteTask,
  onEditTask,
  onQueueCommand,
  onRunTask,
  runningTaskId,
  tasks,
}) {
  return (
    <SectionCard
      title="Tarefas e logs recentes"
      description="Fila operacional do produto, pronta para ser consumida por um agente externo com sessao persistida."
      className="overflow-hidden"
    >
      <div className="space-y-4">
        {tasks.map((task) => (
          (() => {
            const latestCommand = getLatestCommand(commandByTaskId, task.id)

            return (
              <article
                key={task.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{task.externalAccountName}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Proxima execucao em {formatCountdown(task.nextRunAt)}
                    </p>
                  </div>
                  <StatusBadge status={task.status}>{task.status}</StatusBadge>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-300 xl:grid-cols-2">
                  <p>
                    <strong className="text-white">Ultimo resultado:</strong> {task.lastResult}
                  </p>
                  <p>
                    <strong className="text-white">Ultima execucao:</strong> {formatDateTime(task.lastRunAt)}
                  </p>
                  <p>
                    <strong className="text-white">Runner:</strong>{' '}
                    {accountById[task.externalAccountId]?.runnerStatus ?? 'idle'}
                  </p>
                  <p>
                    <strong className="text-white">Sessao:</strong>{' '}
                    {accountById[task.externalAccountId]?.sessionStatus ?? 'pending'}
                  </p>
                  <p>
                    <strong className="text-white">Prioridade:</strong> {task.priority ?? 1}
                  </p>
                  <p>
                    <strong className="text-white">Ciclo:</strong> {task.cycleHours ?? 3}h
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-500/5 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Modo assistido</p>
                    <StatusBadge status={latestCommand?.status ?? 'idle'}>
                      {latestCommand?.status ?? 'idle'}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {latestCommand
                      ? `${COMMAND_LABELS[latestCommand.type] ?? latestCommand.type} · ${latestCommand.resultSummary || 'Aguardando agente.'}`
                      : 'Nenhum comando assistido recente para esta tarefa.'}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {latestCommand ? formatDateTime(latestCommand.updatedAt) : 'Sem historico'}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                    onClick={() => onEditTask(task)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    onClick={() => onRunTask(task)}
                  >
                    {runningTaskId === task.id ? 'Executando...' : 'Executar ciclo'}
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900"
                    disabled={isSubmitting}
                    onClick={() => onQueueCommand(task, 'validate_session')}
                  >
                    Validar sessao
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900"
                    disabled={isSubmitting}
                    onClick={() => onQueueCommand(task, 'open_trade')}
                  >
                    Abrir trade
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
                    disabled={isSubmitting}
                    onClick={() => onQueueCommand(task, 'prepare_cycle')}
                  >
                    Preparar ciclo
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
                    disabled={isSubmitting}
                    onClick={() => onDeleteTask(task.id)}
                  >
                    Remover
                  </button>
                </div>
              </article>
            )
          })()
        ))}

        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
          <p className="text-sm font-semibold text-white">Logs recentes</p>
          <div className="mt-4 space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum log registrado.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{log.externalAccountName}</p>
                    <p className="text-sm text-slate-400">{log.message}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={log.status}>{log.status}</StatusBadge>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

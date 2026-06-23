import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import { formatDateTime } from '../../../utils/productFormatters'

function getTaskAccount(accountsById, task) {
  return accountsById[task.externalAccountId] ?? null
}

export function ExecutorStatusPanel({
  accountsById,
  activeTasks,
  agents,
}) {
  return (
    <SectionCard
      title="Executor e agente"
      description="Presenca do agente externo, sessao persistida e fila pronta para validacao do fluxo."
    >
      <div className="grid gap-6 2xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                Agentes
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {String(agents.length).padStart(2, '0')}
              </p>
              <p className="mt-1 text-sm text-slate-400">Instancias visiveis no painel.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                Online
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {String(
                  agents.filter((item) => ['online', 'busy', 'idle'].includes(item.status)).length,
                ).padStart(2, '0')}
              </p>
              <p className="mt-1 text-sm text-slate-400">Heartbeats recentes e ativos.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                Na fila
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {String(
                  activeTasks.filter(
                    (item) => item.status === 'active' && item.agentStatus !== 'claimed',
                  ).length,
                ).padStart(2, '0')}
              </p>
              <p className="mt-1 text-sm text-slate-400">Tarefas ativas aguardando claim.</p>
            </div>
          </div>

          <div className="space-y-3">
            {agents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
                Nenhum agente reportou heartbeat ainda. Configure `AGENT_SHARED_SECRET` no backend e inicie o worker externo.
              </div>
            ) : (
              agents.map((agent) => (
                <article
                  key={agent.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {agent.label || agent.agentId}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {agent.hostname || 'Host nao informado'} {agent.version ? `· v${agent.version}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={agent.status}>{agent.status || 'offline'}</StatusBadge>
                      <StatusBadge status={agent.sessionStatus}>
                        {agent.sessionStatus || 'pending'}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300 xl:grid-cols-2">
                    <p>
                      <strong className="text-white">Fila:</strong> {agent.queueMode || 'single'}
                    </p>
                    <p>
                      <strong className="text-white">Task atual:</strong>{' '}
                      {agent.currentTaskId || '-'}
                    </p>
                    <p>
                      <strong className="text-white">Ultimo heartbeat:</strong>{' '}
                      {formatDateTime(agent.lastHeartbeatAt)}
                    </p>
                    <p>
                      <strong className="text-white">Ultima validacao:</strong>{' '}
                      {formatDateTime(agent.lastValidationAt)}
                    </p>
                  </div>
                  {agent.lastError ? (
                    <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                      {agent.lastError}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          {activeTasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
              Nenhuma tarefa ativa na fila do executor.
            </div>
          ) : (
            activeTasks.slice(0, 6).map((task) => {
              const account = getTaskAccount(accountsById, task)

              return (
                <article
                  key={task.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {task.externalAccountName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {task.validationSummary || task.lastResult || 'Aguardando validacao do agente.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.agentStatus || 'idle'}>
                        {task.agentStatus || 'idle'}
                      </StatusBadge>
                      <StatusBadge status={account?.sessionStatus || task.validationStatus || 'pending'}>
                        {account?.sessionStatus || task.validationStatus || 'pending'}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300 xl:grid-cols-2">
                    <p>
                      <strong className="text-white">Prioridade:</strong> {task.priority ?? 1}
                    </p>
                    <p>
                      <strong className="text-white">Claim por:</strong> {task.claimedBy || '-'}
                    </p>
                    <p>
                      <strong className="text-white">Ultima validacao:</strong>{' '}
                      {formatDateTime(task.lastValidatedAt)}
                    </p>
                    <p>
                      <strong className="text-white">Sessao:</strong>{' '}
                      {account?.sessionStatus || 'pending'}
                    </p>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </SectionCard>
  )
}

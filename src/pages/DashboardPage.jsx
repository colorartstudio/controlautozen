import { useEffect, useMemo, useState } from 'react'
import { SectionCard } from '../components/ui/SectionCard'
import { StatCard } from '../components/ui/StatCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { subscribeToAutomationTasks } from '../services/automationTasks'
import { subscribeToExecutionLogs } from '../services/executionLogs'
import { subscribeToExternalAccounts } from '../services/externalAccounts'
import { subscribeToReferral } from '../services/referrals'
import { subscribeToSubscription } from '../services/subscriptions'
import {
  buildReferralUrl,
  formatCountdown,
  formatCurrencyBRL,
  formatDateTime,
} from '../utils/productFormatters'

export function DashboardPage() {
  const session = useAuth()
  const [accounts, setAccounts] = useState([])
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [referral, setReferral] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session.isAuthenticated) {
      return undefined
    }

    const unsubscribers = [
      subscribeToExternalAccounts({
        ownerId: session.authUser.uid,
        isAdmin: session.isAdmin,
        next: setAccounts,
        error: (nextError) => setError(nextError.message),
      }),
      subscribeToAutomationTasks({
        ownerId: session.authUser.uid,
        isAdmin: session.isAdmin,
        next: setTasks,
        error: (nextError) => setError(nextError.message),
      }),
      subscribeToExecutionLogs({
        ownerId: session.authUser.uid,
        isAdmin: session.isAdmin,
        next: (items) => setLogs(items.slice(0, 6)),
        error: (nextError) => setError(nextError.message),
      }),
      subscribeToSubscription(
        session.authUser.uid,
        setSubscription,
        (nextError) => setError(nextError.message),
      ),
      subscribeToReferral(
        session.authUser.uid,
        setReferral,
        (nextError) => setError(nextError.message),
      ),
    ]

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.())
    }
  }, [session.authUser?.uid, session.isAdmin, session.isAuthenticated])

  const activeAccounts = accounts.filter((item) => item.status === 'active').length
  const activeTasks = tasks.filter((item) => item.status === 'active').length
  const latestLog = logs[0]
  const referralUrl = buildReferralUrl(referral?.code)
  const nextTask = useMemo(
    () =>
      [...tasks]
        .filter((item) => item.nextRunAt)
        .sort((first, second) => new Date(first.nextRunAt) - new Date(second.nextRunAt))[0],
    [tasks],
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          eyebrow="Contas"
          title="Contas externas ativas"
          value={activeAccounts}
          description={`${accounts.length} cadastradas com sessao planejada para browser persistido.`}
        />
        <StatCard
          eyebrow="Automacao"
          title="Timers ativos"
          value={activeTasks}
          description={`${tasks.length} tarefas registradas antes do executor entrar em cena.`}
        />
        <StatCard
          eyebrow="Assinatura"
          title="Plano atual"
          value={subscription?.status ?? 'trialing'}
          description={`${formatCurrencyBRL(subscription?.priceAmount ?? 20)} por ${subscription?.billingCycle === 'monthly' ? 'mes' : 'ciclo'}.`}
        />
        <StatCard
          eyebrow="Logs"
          title="Ultimo evento"
          value={latestLog?.status ?? 'sem log'}
          description={latestLog?.message || 'Nenhuma execucao registrada ainda.'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Resumo operacional"
          description="Visao rapida do que ja esta pronto para a proxima fase do produto."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Proxima janela</p>
                <StatusBadge status={nextTask?.status ?? 'pending'}>
                  {nextTask?.status ?? 'pendente'}
                </StatusBadge>
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">
                {formatCountdown(nextTask?.nextRunAt)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {nextTask
                  ? `${nextTask.externalAccountName || 'Conta sem nome'}: ${nextTask.lastResult || 'Aguardando primeira execucao'}`
                  : 'Cadastre uma tarefa em Automacao para acompanhar o proximo ciclo.'}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Indicacao</p>
                <StatusBadge status={session.isRecruiter ? 'active' : referral?.status}>
                  {session.isRecruiter ? 'recrutador' : referral?.status ?? 'inativo'}
                </StatusBadge>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {referralUrl
                  ? `Link pronto para uso: ${referralUrl}`
                  : 'O link de indicacao sera liberado assim que o perfil de referral estiver pronto.'}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                Codigo {referral?.code ?? '-'}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Assinatura</p>
                <StatusBadge status={subscription?.status}>{subscription?.status ?? 'trialing'}</StatusBadge>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                <p>
                  <strong className="text-white">Plano:</strong> {subscription?.planName ?? 'ControlAutoZen Starter'}
                </p>
                <p>
                  <strong className="text-white">Trial ate:</strong> {formatDateTime(subscription?.trialEndsAt)}
                </p>
                <p>
                  <strong className="text-white">Proxima cobranca:</strong>{' '}
                  {formatDateTime(subscription?.nextBillingAt)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Ultimos logs"
          description="Registro manual e futuro trilho para observabilidade do executor."
        >
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                Nenhum log por enquanto. A pagina de Automacao ja permite registrar eventos manuais.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{log.externalAccountName || 'Conta geral'}</p>
                      <p className="mt-1 text-sm text-slate-400">{log.message}</p>
                    </div>
                    <StatusBadge status={log.status}>{log.status}</StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span>{log.type}</span>
                    <span>{formatDateTime(log.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}

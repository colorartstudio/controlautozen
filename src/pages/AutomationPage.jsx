import { useEffect, useMemo, useState } from 'react'
import { AutomationActivityPanel } from '../components/product/automation/AutomationActivityPanel'
import { ExecutorStatusPanel } from '../components/product/automation/ExecutorStatusPanel'
import { AutomationTaskForm } from '../components/product/automation/AutomationTaskForm'
import { AutomationTimersPanel } from '../components/product/automation/AutomationTimersPanel'
import { ManualLogForm } from '../components/product/automation/ManualLogForm'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../hooks/useAuth'
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess'
import {
  createAutomationTask,
  deleteAutomationTask,
  subscribeToAutomationTasks,
  updateAutomationTask,
} from '../services/automationTasks'
import {
  createExecutionLog,
  subscribeToExecutionLogs,
} from '../services/executionLogs'
import { runAutomationTask } from '../services/executor'
import { subscribeToExternalAccounts } from '../services/externalAccounts'
import { subscribeToAgentHeartbeats } from '../services/agents'

const TASK_FORM = {
  externalAccountId: '',
  cycleHours: '3',
  id: '',
  lastResult: 'Aguardando',
  minAvailableBalance: '10',
  nextRunAt: '',
  notes: '',
  plusAmount: '50',
  priority: '1',
  status: 'draft',
}

const LOG_FORM = {
  externalAccountId: '',
  message: '',
  status: 'pending',
  type: 'manual',
}

export function AutomationPage() {
  const session = useAuth()
  const subscriptionAccess = useSubscriptionAccess()
  const [accounts, setAccounts] = useState([])
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [agents, setAgents] = useState([])
  const [taskForm, setTaskForm] = useState(TASK_FORM)
  const [logForm, setLogForm] = useState(LOG_FORM)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runningTaskId, setRunningTaskId] = useState('')

  useEffect(() => {
    if (!session.isAuthenticated) {
      return undefined
    }

    const unsubscribers = [
      subscribeToAgentHeartbeats({
        next: setAgents,
        error: (nextError) => setError(nextError.message),
      }),
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
        next: (items) => setLogs(items.slice(0, 8)),
        error: (nextError) => setError(nextError.message),
      }),
    ]

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.())
    }
  }, [session.authUser?.uid, session.isAdmin, session.isAuthenticated])

  const taskAccountName =
    accounts.find((item) => item.id === taskForm.externalAccountId)?.name ?? ''
  const logAccountName =
    accounts.find((item) => item.id === logForm.externalAccountId)?.name ?? ''
  const canSaveTask = Boolean(taskForm.externalAccountId && taskForm.nextRunAt)
  const canCreateLog = Boolean(logForm.externalAccountId && logForm.message.trim())

  const activeTimers = useMemo(
    () => tasks.filter((item) => item.status === 'active'),
    [tasks],
  )
  const queueTasks = useMemo(
    () =>
      [...activeTimers].sort((left, right) => {
        const priorityDiff = Number(left.priority ?? 999) - Number(right.priority ?? 999)

        if (priorityDiff !== 0) {
          return priorityDiff
        }

        return String(left.nextRunAt ?? '').localeCompare(String(right.nextRunAt ?? ''))
      }),
    [activeTimers],
  )
  const accountById = useMemo(
    () =>
      accounts.reduce((accumulator, item) => {
        accumulator[item.id] = item
        return accumulator
      }, {}),
    [accounts],
  )
  const runnerConnectedCount = useMemo(
    () => accounts.filter((item) => item.sessionStatus === 'connected').length,
    [accounts],
  )

  function resetTaskForm() {
    setTaskForm(TASK_FORM)
  }

  function handleTaskChange(event) {
    const { name, value } = event.target
    setFeedback('')
    setError('')
    setTaskForm((current) => ({ ...current, [name]: value }))
  }

  function handleLogChange(event) {
    const { name, value } = event.target
    setFeedback('')
    setError('')
    setLogForm((current) => ({ ...current, [name]: value }))
  }

  async function handleTaskSubmit(event) {
    event.preventDefault()
    setFeedback('')
    setError('')
    setIsSubmitting(true)

    try {
      if (!subscriptionAccess.canManageProduct && !session.isAdmin) {
        throw new Error(subscriptionAccess.readOnlyReason)
      }

      const payload = {
        ...taskForm,
        externalAccountName: taskAccountName,
      }

      if (taskForm.id) {
        await updateAutomationTask(taskForm.id, payload)
        setFeedback('Tarefa atualizada com sucesso.')
      } else {
        await createAutomationTask(session.authUser.uid, payload)
        setFeedback('Tarefa criada com sucesso.')
      }

      resetTaskForm()
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteTask(id) {
    setFeedback('')
    setError('')
    setIsSubmitting(true)

    try {
      if (!subscriptionAccess.canManageProduct && !session.isAdmin) {
        throw new Error(subscriptionAccess.readOnlyReason)
      }

      await deleteAutomationTask(id)
      if (taskForm.id === id) {
        resetTaskForm()
      }
      setFeedback('Tarefa removida.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogSubmit(event) {
    event.preventDefault()
    setFeedback('')
    setError('')
    setIsSubmitting(true)

    try {
      if (!subscriptionAccess.canManageProduct && !session.isAdmin) {
        throw new Error(subscriptionAccess.readOnlyReason)
      }

      await createExecutionLog(session.authUser.uid, {
        ...logForm,
        externalAccountName: logAccountName,
      })
      setLogForm(LOG_FORM)
      setFeedback('Log manual registrado com sucesso.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function editTask(task) {
    setTaskForm({
      cycleHours: String(task.cycleHours ?? '3'),
      externalAccountId: task.externalAccountId ?? '',
      id: task.id,
      lastResult: task.lastResult ?? 'Aguardando',
      minAvailableBalance: String(task.minAvailableBalance ?? '10'),
      nextRunAt: task.nextRunAt ?? '',
      notes: task.notes ?? '',
      plusAmount: String(task.plusAmount ?? '50'),
      priority: String(task.priority ?? '1'),
      status: task.status ?? 'draft',
    })

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleRunTask(task) {
    setFeedback('')
    setError('')
    setRunningTaskId(task.id)
    setIsSubmitting(true)

    try {
      if (!subscriptionAccess.canManageProduct && !session.isAdmin) {
        throw new Error(subscriptionAccess.readOnlyReason)
      }

      await runAutomationTask({
        externalAccountId: task.externalAccountId,
        taskId: task.id,
      })
      setFeedback(
        `Executor interno iniciou e concluiu o ciclo da conta ${task.externalAccountName}.`,
      )
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setRunningTaskId('')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {subscriptionAccess.isReady && !subscriptionAccess.canManageProduct && !session.isAdmin ? (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {subscriptionAccess.readOnlyReason}
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          eyebrow="Fila"
          title="Tarefas prontas"
          value={String(tasks.length).padStart(2, '0')}
          description="Itens que o adaptador externo vai consumir a partir do painel."
        />
        <StatCard
          eyebrow="Timers"
          title="Ciclos ativos"
          value={String(activeTimers.length).padStart(2, '0')}
          description="Cronometros em execucao ou aguardando a proxima janela."
        />
        <StatCard
          eyebrow="Sessoes"
          title="Contas conectadas"
          value={String(runnerConnectedCount).padStart(2, '0')}
          description="Contas com indicacao de sessao pronta para validacao do fluxo."
        />
        <StatCard
          eyebrow="Observabilidade"
          title="Logs recentes"
          value={String(logs.length).padStart(2, '0')}
          description="Eventos de operacao e pontos de verificacao registrados no painel."
        />
      </div>

      <ExecutorStatusPanel
        accountsById={accountById}
        activeTasks={queueTasks}
        agents={agents}
      />

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="space-y-6">
          <AutomationTaskForm
            accounts={accounts}
            canSaveTask={canSaveTask && (subscriptionAccess.canManageProduct || session.isAdmin)}
            form={taskForm}
            isSubmitting={isSubmitting}
            onChange={handleTaskChange}
            onReset={resetTaskForm}
            onSubmit={handleTaskSubmit}
          />

          <AutomationActivityPanel
            accountById={accountById}
            isSubmitting={isSubmitting || (!subscriptionAccess.canManageProduct && !session.isAdmin)}
            logs={logs}
            onDeleteTask={handleDeleteTask}
            onEditTask={editTask}
            onRunTask={handleRunTask}
            runningTaskId={runningTaskId}
            tasks={tasks}
          />
        </div>

        <div className="space-y-6 2xl:sticky 2xl:top-4 2xl:self-start">
          <AutomationTimersPanel
            activeTimers={activeTimers}
            isSubmitting={isSubmitting || Boolean(runningTaskId)}
            onEditTask={editTask}
          />

          <ManualLogForm
            accounts={accounts}
            canCreateLog={canCreateLog && (subscriptionAccess.canManageProduct || session.isAdmin)}
            form={logForm}
            isSubmitting={isSubmitting}
            onChange={handleLogChange}
            onSubmit={handleLogSubmit}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {feedback ? <p className="text-sky-200">{feedback}</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
      </div>
    </div>
  )
}

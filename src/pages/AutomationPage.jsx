import { useEffect, useMemo, useState } from 'react'
import { AutomationActivityPanel } from '../components/product/automation/AutomationActivityPanel'
import { AutomationTaskForm } from '../components/product/automation/AutomationTaskForm'
import { AutomationTimersPanel } from '../components/product/automation/AutomationTimersPanel'
import { ManualLogForm } from '../components/product/automation/ManualLogForm'
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
  const accountById = useMemo(
    () =>
      accounts.reduce((accumulator, item) => {
        accumulator[item.id] = item
        return accumulator
      }, {}),
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
      <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <AutomationTaskForm
          accounts={accounts}
          canSaveTask={canSaveTask && (subscriptionAccess.canManageProduct || session.isAdmin)}
          form={taskForm}
          isSubmitting={isSubmitting}
          onChange={handleTaskChange}
          onReset={resetTaskForm}
          onSubmit={handleTaskSubmit}
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AutomationTimersPanel
          activeTimers={activeTimers}
          isSubmitting={isSubmitting || Boolean(runningTaskId)}
          onEditTask={editTask}
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

      <div className="space-y-2 text-sm">
        {feedback ? <p className="text-sky-200">{feedback}</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
      </div>
    </div>
  )
}

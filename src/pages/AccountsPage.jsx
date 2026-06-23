import { useEffect, useMemo, useState } from 'react'
import { ExternalAccountForm } from '../components/product/accounts/ExternalAccountForm'
import { ExternalAccountList } from '../components/product/accounts/ExternalAccountList'
import { useAuth } from '../hooks/useAuth'
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess'
import {
  removeExternalAccount,
  saveExternalAccount,
  subscribeToExternalAccounts,
} from '../services/externalAccounts'

const INITIAL_FORM = {
  id: '',
  name: '',
  notes: '',
  password: '',
  phone: '',
  status: 'active',
}

export function AccountsPage() {
  const session = useAuth()
  const subscriptionAccess = useSubscriptionAccess()
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!session.isAuthenticated) {
      return undefined
    }

    return subscribeToExternalAccounts({
      ownerId: session.authUser.uid,
      isAdmin: session.isAdmin,
      next: setAccounts,
      error: (nextError) => setError(nextError.message),
    })
  }, [session.authUser?.uid, session.isAdmin, session.isAuthenticated])

  const isEditing = Boolean(form.id)
  const canSubmit = useMemo(() => {
    if (!form.name.trim()) {
      return false
    }

    if (!isEditing && (!form.phone.trim() || !form.password.trim())) {
      return false
    }

    return true
  }, [form, isEditing])

  function resetForm() {
    setForm(INITIAL_FORM)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFeedback('')
    setError('')
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback('')
    setError('')
    setIsSubmitting(true)

    try {
      if (!subscriptionAccess.canManageProduct && !session.isAdmin) {
        throw new Error(subscriptionAccess.readOnlyReason)
      }

      await saveExternalAccount(form)
      setFeedback(
        isEditing
          ? 'Conta externa atualizada com criptografia mantida no servidor.'
          : 'Conta externa salva com credenciais protegidas no backend.',
      )
      resetForm()
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setFeedback('')
    setError('')
    setIsSubmitting(true)

    try {
      if (!subscriptionAccess.canManageProduct && !session.isAdmin) {
        throw new Error(subscriptionAccess.readOnlyReason)
      }

      await removeExternalAccount(id)
      if (form.id === id) {
        resetForm()
      }
      setFeedback('Conta externa removida com sucesso.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEdit(account) {
    setFeedback('')
    setError('')
    setForm({
      id: account.id,
      name: account.name ?? '',
      notes: account.notes ?? '',
      password: '',
      phone: '',
      status: account.status ?? 'active',
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      {subscriptionAccess.isReady && !subscriptionAccess.canManageProduct && !session.isAdmin ? (
        <div className="xl:col-span-2 rounded-3xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {subscriptionAccess.readOnlyReason}
        </div>
      ) : null}
      <ExternalAccountForm
        canSubmit={canSubmit && (subscriptionAccess.canManageProduct || session.isAdmin)}
        error={error}
        feedback={feedback}
        form={form}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onReset={resetForm}
        onSubmit={handleSubmit}
      />

      <ExternalAccountList
        accounts={accounts}
        isSubmitting={isSubmitting || (!subscriptionAccess.canManageProduct && !session.isAdmin)}
        onDelete={handleDelete}
        onEdit={startEdit}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { promoteUserRole, setAuthDisabledStatus } from '../../services/admin'
import { subscribeToUsers } from '../../services/users'

export function AdminAccessCard({ session }) {
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!session.isAdmin) {
      setUsers([])
      setSelectedId('')
      return undefined
    }

    return subscribeToUsers(
      (items) => {
        setUsers(items)
        setSelectedId((current) => current || items[0]?.id || '')
      },
      (error) => setFeedback(error.message),
    )
  }, [session.isAdmin])

  if (!session.isAdmin) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Acesso administrativo</h2>
        <p className="mt-2 text-sm text-slate-400">
          As acoes seguras de Auth ficam disponiveis apenas para administradores.
        </p>
      </section>
    )
  }

  const selectedUser = users.find((item) => item.id === selectedId)

  async function runAction(action) {
    if (!selectedUser) {
      return
    }

    setFeedback('')
    setIsSubmitting(true)

    try {
      await action(selectedUser.id)
      setFeedback('Acao administrativa concluida com sucesso.')
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
      <h2 className="text-lg font-semibold text-white">Acesso administrativo</h2>
      <p className="mt-2 text-sm text-slate-400">
        Estas acoes usam Vercel Functions com `firebase-admin` para manter
        `claims` e status do Auth alinhados ao Firestore.
      </p>
      <p className="mt-2 text-sm text-slate-400">
        Se a API admin ainda nao estiver configurada no Vercel, a tela mostra
        aviso claro em vez de depender do plano Blaze do Firebase.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Usuario alvo</span>
          <select
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/60"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName || user.email || user.id}
              </option>
            ))}
          </select>
        </label>

        {selectedUser && (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              <span>
                <strong className="text-white">Papel:</strong> {selectedUser.role ?? 'user'}
              </span>
              <span>
                <strong className="text-white">Status:</strong> {selectedUser.status ?? 'active'}
              </span>
              <span>
                <strong className="text-white">Auth:</strong>{' '}
                {selectedUser.authDisabled ? 'Desativado' : 'Ativo'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={() => runAction((uid) => promoteUserRole(uid, 'admin'))}
              >
                Promover admin
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={() => runAction((uid) => promoteUserRole(uid, 'recruiter'))}
              >
                Tornar recrutador
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={() => runAction((uid) => promoteUserRole(uid, 'user'))}
              >
                Voltar para user
              </button>
              <button
                type="button"
                className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={() => runAction((uid) => setAuthDisabledStatus(uid, true))}
              >
                Desativar login
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={() => runAction((uid) => setAuthDisabledStatus(uid, false))}
              >
                Reativar login
              </button>
            </div>
          </div>
        )}
      </div>

      {feedback ? <p className="mt-4 text-sm text-sky-200">{feedback}</p> : null}
    </section>
  )
}

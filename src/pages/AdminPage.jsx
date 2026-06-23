import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AdminAccessCard } from '../components/admin/AdminAccessCard'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { subscribeToUsers } from '../services/users'
import { formatDateTime } from '../utils/productFormatters'

export function AdminPage() {
  const session = useAuth()
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session.isAdmin) {
      return undefined
    }

    return subscribeToUsers(
      setUsers,
      (nextError) => setError(nextError.message),
    )
  }, [session.isAdmin])

  if (!session.isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm font-semibold text-white">Usuarios totais</p>
          <p className="mt-3 text-3xl font-semibold text-white">{users.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm font-semibold text-white">Admins</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {users.filter((user) => user.role === 'admin').length}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm font-semibold text-white">Recrutadores</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {users.filter((user) => user.role === 'recruiter').length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <AdminAccessCard session={session} />

        <SectionCard
          title="Diretorio de usuarios"
          description="Visao consolidada para acompanhar papeis, status e ultimas atualizacoes."
        >
          <div className="space-y-3">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {user.displayName || user.email || user.uid}
                    </h3>
                    <p className="mt-1 break-all text-sm text-slate-400">{user.email || user.uid}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={user.role}>{user.role ?? 'user'}</StatusBadge>
                    <StatusBadge status={user.status}>{user.status ?? 'active'}</StatusBadge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                  <p>
                    <strong className="text-white">Auth:</strong>{' '}
                    {user.authDisabled ? 'Desativado' : 'Ativo'}
                  </p>
                  <p>
                    <strong className="text-white">Ultimo acesso:</strong>{' '}
                    {formatDateTime(user.lastLoginAt)}
                  </p>
                </div>
              </article>
            ))}
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

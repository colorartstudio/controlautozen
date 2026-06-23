import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess'
import { logout } from '../../services/auth'
import { useAuth } from '../../hooks/useAuth'

const navigation = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Contas', to: '/contas' },
  { label: 'Automacao', to: '/automacao' },
  { label: 'Assinatura', to: '/assinatura' },
]

function sidebarLinkClass({ isActive }) {
  return `flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
    isActive
      ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
      : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`
}

export function ProtectedLayout() {
  const session = useAuth()
  const subscriptionAccess = useSubscriptionAccess()
  const location = useLocation()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pageTitle = useMemo(() => {
    const current = [...navigation, { label: 'Admin', to: '/admin' }].find(
      (item) => item.to === location.pathname,
    )

    return current?.label ?? 'ControlAutoZen'
  }, [location.pathname])

  useEffect(() => {
    document.title = `${pageTitle} | ControlAutoZen`
  }, [pageTitle])

  if (!session.isAuthReady || !session.isProfileReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-200">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 px-8 py-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-300">ControlAutoZen</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Carregando painel</h1>
          <p className="mt-2 text-sm text-slate-400">
            Preparando sessao, permissao e atalhos do produto.
          </p>
        </div>
      </div>
    )
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  async function handleLogout() {
    setIsSigningOut(true)

    try {
      await logout()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur lg:flex lg:flex-col">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-300/80">
              ControlAutoZen
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Painel operacional</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Contas externas, cronometros, logs e assinatura em uma interface pronta para virar produto.
            </p>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-2">
            {navigation.map((item) => (
              <NavLink key={item.to} className={sidebarLinkClass} to={item.to}>
                {item.label}
              </NavLink>
            ))}
            {session.isAdmin ? (
              <NavLink className={sidebarLinkClass} to="/admin">
                Admin
              </NavLink>
            ) : null}
          </nav>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm text-sky-100">
            <p className="font-semibold">Executor ativo</p>
            <p className="mt-2 text-sky-100/80">
              A fila unica ja roda no backend com logs e reagendamento. Qualquer adaptador externo fica desacoplado desta base.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col gap-6">
          <header className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                  {pageTitle}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {session.profile?.displayName || session.authUser?.email || 'Operador'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Sessao {session.isAdmin ? 'administrativa' : session.isRecruiter ? 'recrutador' : 'do cliente'} com persistencia Firebase.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <p className="font-medium text-white">{session.authUser?.email}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {session.profile?.role ?? 'user'}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                  disabled={isSigningOut}
                  onClick={handleLogout}
                >
                  {isSigningOut ? 'Saindo...' : 'Encerrar sessao'}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {subscriptionAccess.isReady && !subscriptionAccess.canManageProduct ? (
              <div className="mb-6 rounded-3xl border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
                Assinatura pausada. O painel continua visivel, mas `Contas` e `Automacao` ficam em modo leitura ate a confirmacao do pagamento.
              </div>
            ) : null}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

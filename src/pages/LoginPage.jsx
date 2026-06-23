import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { AuthPanel } from '../components/auth/AuthPanel'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const session = useAuth()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('ref')

  useEffect(() => {
    document.title = 'Login | ControlAutoZen'
  }, [])

  if (session.isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.25rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-300/80">
            ControlAutoZen
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Painel para organizar contas externas, timers, logs e assinatura com cara de produto.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Esta etapa prepara o sistema para persistir sessoes, centralizar operacoes e encaixar o executor depois, sem trocar sua stack atual.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Browser persistido</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Base pronta para manter credenciais e sessao logada via backend seguro.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Fila de execucao</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                O fluxo futuro entra com uma conta por vez, aproveitando tarefas e logs ja modelados.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Assinatura simples</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Trial de 7 dias e base para plano mensal de R$ 20 sem precisar mudar a estrutura depois.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Indicacao nativa</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Perfil de recrutador com link pronto para cadastro quando o admin liberar.
              </p>
            </div>
          </div>

          {referralCode ? (
            <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Voce chegou por um link de indicacao: <strong>{referralCode}</strong>
            </div>
          ) : null}
        </section>

        <AuthPanel session={session} />
      </div>
    </div>
  )
}

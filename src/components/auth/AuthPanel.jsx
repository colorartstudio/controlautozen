import { useMemo, useState } from 'react'
import {
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
} from '../../services/auth'
import { PasswordInput } from '../ui/PasswordInput'
import { isEmailValid } from '../../utils/formFormatters'

const INITIAL_FORM = {
  displayName: '',
  email: '',
  password: '',
}

export function AuthPanel({ session }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(INITIAL_FORM)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = useMemo(() => {
    if (!form.email || !form.password || !isEmailValid(form.email)) {
      return false
    }

    if (form.password.length < 6) {
      return false
    }

    if (mode === 'register' && !form.displayName.trim()) {
      return false
    }

    return true
  }, [form, mode])

  function handleChange(event) {
    const { name, value } = event.target
    setError('')
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback('')
    setError('')

    if (!isEmailValid(form.email)) {
      setError('Informe um email valido.')
      return
    }

    if (form.password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (mode === 'register' && !form.displayName.trim()) {
      setError('Informe um nome para criar a conta.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'register') {
        await registerWithEmail(form)
        setFeedback('Conta criada com sucesso.')
      } else {
        await loginWithEmail(form)
        setFeedback('Login realizado com sucesso.')
      }

      setForm(INITIAL_FORM)
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setFeedback('')
    setError('')
    setIsSubmitting(true)

    try {
      await loginWithGoogle()
      setFeedback('Login com Google realizado com sucesso.')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    setFeedback('')
    setError('')
    setIsSubmitting(true)

    try {
      await logout()
      setFeedback('Sessao encerrada.')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Acesso
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Entrar no painel</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use email e senha para acessar, testar o fluxo e acompanhar o produto por dentro.
          </p>
        </div>
        {session.isAuthenticated ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            {session.isAdmin ? 'Admin' : 'Ativo'}
          </span>
        ) : null}
      </div>

      {session.isAuthenticated ? (
        <div className="mt-8 space-y-4">
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p>
              <span className="font-semibold text-white">Email:</span> {session.authUser?.email}
            </p>
            <p className="break-all">
              <span className="font-semibold text-white">UID:</span> {session.authUser?.uid}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
            onClick={handleLogout}
            disabled={isSubmitting}
          >
            Sair
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === 'login'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
              onClick={() => setMode('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
              onClick={() => setMode('register')}
            >
              Criar conta
            </button>
          </div>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Nome</span>
                <input
                  className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-sky-400/70 focus:bg-slate-950"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Seu nome"
                />
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-sky-400/70 focus:bg-slate-950"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="voce@exemplo.com"
              />
            </label>

            <PasswordInput
              name="password"
              onChange={handleChange}
              placeholder="Minimo de 6 caracteres"
              value={form.password}
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canSubmit || isSubmitting}
              >
                {mode === 'register' ? 'Criar conta' : 'Entrar'}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                Entrar com Google
              </button>
            </div>
          </form>
        </>
      )}

      <div className="mt-6 space-y-2 text-sm">
        {feedback ? <p className="text-sky-200">{feedback}</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        {session.error ? <p className="text-rose-200">{session.error}</p> : null}
      </div>
    </section>
  )
}

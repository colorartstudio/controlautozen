import { useEffect, useState } from 'react'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import {
  createSubscriptionPayment,
  refreshSubscriptionPaymentStatus,
} from '../services/billing'
import { subscribeToReferral } from '../services/referrals'
import { subscribeToSubscription } from '../services/subscriptions'
import {
  buildReferralUrl,
  formatCurrencyBRL,
  formatDateTime,
} from '../utils/productFormatters'
import {
  getBillingStatusLabel,
  getSubscriptionAccessState,
} from '../utils/subscriptionAccess'

export function SubscriptionPage() {
  const session = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [referral, setReferral] = useState(null)
  const [copied, setCopied] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!session.isAuthenticated) {
      return undefined
    }

    const unsubscribers = [
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
  }, [session.authUser?.uid, session.isAuthenticated])

  const referralUrl = buildReferralUrl(referral?.code)
  const access = getSubscriptionAccessState(subscription)
  const hasPayment = Boolean(subscription?.paymentId)
  const paymentContextLabel =
    subscription?.paymentContext === 'renewal'
      ? 'Renovacao mensal'
      : subscription?.paymentContext === 'reactivation'
        ? 'Reativacao'
        : 'Primeira cobranca'

  async function handleCopy() {
    if (!referralUrl) {
      return
    }

    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function handleCopyAddress() {
    if (!subscription?.paymentAddress) {
      return
    }

    await navigator.clipboard.writeText(subscription.paymentAddress)
    setCopiedAddress(true)
    window.setTimeout(() => setCopiedAddress(false), 1600)
  }

  async function handleCreatePayment() {
    setError('')
    setFeedback('')
    setIsSubmitting(true)

    try {
      const result = await createSubscriptionPayment()
      setFeedback(
        result.reused
          ? 'Cobrança pendente reaproveitada com sucesso.'
          : 'Cobrança cripto criada com sucesso. Envie o valor exato em USDT BSC.',
      )
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRefreshPaymentStatus() {
    if (!subscription?.paymentId) {
      return
    }

    setError('')
    setFeedback('')
    setIsSubmitting(true)

    try {
      const result = await refreshSubscriptionPaymentStatus(subscription.paymentId)
      setFeedback(
        result.paymentStatus
          ? `Status atualizado: ${getBillingStatusLabel(result.paymentStatus)}.`
          : 'Status da cobrança atualizado com sucesso.',
      )
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SectionCard
        title="Assinatura"
        description="Assinatura real com NOWPayments em USDT BSC, mantendo trial de 7 dias e pausa da automacao quando nao houver acesso valido."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Plano atual</p>
              <StatusBadge status={access.effectiveStatus}>
                {access.effectiveStatus}
              </StatusBadge>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">
              {formatCurrencyBRL(subscription?.priceAmount ?? 20)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Cobrança {subscription?.billingCycle === 'monthly' ? 'mensal' : 'por ciclo'} para o painel completo, paga em {String(subscription?.paymentCurrency ?? 'usdtbsc').toUpperCase()}.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Periodo de teste</p>
              <StatusBadge status="trialing">{subscription?.trialDays ?? 7} dias</StatusBadge>
            </div>
            <p className="mt-4 text-base font-medium text-white">
              Trial ate {formatDateTime(subscription?.trialEndsAt)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Ao vencer sem pagamento, o sistema pausa `Contas` e `Automacao`, mas o painel segue visivel em modo leitura.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Checkout cripto</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Gere uma cobrança, envie o valor exato em USDT BSC e atualize o status. O webhook/IPN tambem sincroniza automaticamente quando estiver publico.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                Fluxo atual: {paymentContextLabel}
              </p>
            </div>
            <StatusBadge status={subscription?.paymentStatus}>
              {getBillingStatusLabel(subscription?.paymentStatus)}
            </StatusBadge>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleCreatePayment}
            >
              {isSubmitting
                ? 'Processando...'
                : access.effectiveStatus === 'active'
                  ? 'Gerar renovacao'
                  : hasPayment
                    ? 'Gerar nova cobranca'
                    : 'Gerar cobranca'}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!hasPayment || isSubmitting}
              onClick={handleRefreshPaymentStatus}
            >
              Atualizar status
            </button>
          </div>

          {hasPayment ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Endereco de pagamento</p>
                <p className="mt-3 break-all text-sm leading-6 text-slate-300">
                  {subscription?.paymentAddress || 'Aguardando geracao da carteira.'}
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!subscription?.paymentAddress}
                  onClick={handleCopyAddress}
                >
                  {copiedAddress ? 'Endereco copiado' : 'Copiar endereco'}
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Dados da cobranca</p>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>
                    <strong className="text-white">Valor:</strong> {subscription?.paymentAmount ?? '-'}{' '}
                    {String(subscription?.paymentCurrency ?? 'usdtbsc').toUpperCase()}
                  </p>
                  <p>
                    <strong className="text-white">Contexto:</strong> {paymentContextLabel}
                  </p>
                  <p>
                    <strong className="text-white">Payment ID:</strong> {subscription?.paymentId ?? '-'}
                  </p>
                  <p>
                    <strong className="text-white">Expira em:</strong>{' '}
                    {formatDateTime(subscription?.paymentExpiresAt)}
                  </p>
                  <p>
                    <strong className="text-white">Ultimo pagamento:</strong>{' '}
                    {formatDateTime(subscription?.lastPaymentAt)}
                  </p>
                  <p>
                    <strong className="text-white">Proxima renovacao:</strong>{' '}
                    {formatDateTime(subscription?.nextBillingAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Indicacao"
        description="Cada usuario ja nasce com codigo de referral. O admin pode promover o perfil para recrutador quando quiser."
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Status do referral</p>
              <StatusBadge status={session.isRecruiter ? 'active' : referral?.status}>
                {session.isRecruiter ? 'recrutador' : referral?.status ?? 'inactive'}
              </StatusBadge>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>
                <strong className="text-white">Codigo:</strong> {referral?.code ?? '-'}
              </p>
              <p>
                <strong className="text-white">Cadastros indicados:</strong>{' '}
                {referral?.referredCount ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white">Link de cadastro</p>
            <p className="mt-2 break-all text-sm leading-6 text-slate-300">
              {referralUrl || 'Aguardando codigo de indicacao.'}
            </p>
            <button
              type="button"
              className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!referralUrl}
              onClick={handleCopy}
            >
              {copied ? 'Link copiado' : 'Copiar link'}
            </button>
          </div>
        </div>
      </SectionCard>

      {error ? (
        <div className="xl:col-span-2 rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {feedback ? (
        <div className="xl:col-span-2 rounded-3xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          {feedback}
        </div>
      ) : null}
    </div>
  )
}

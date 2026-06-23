import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import { formatDateTime } from '../../../utils/productFormatters'

export function ExternalAccountList({
  accounts,
  isSubmitting,
  onDelete,
  onEdit,
}) {
  return (
    <SectionCard
      title="Contas cadastradas"
      description="A listagem mostra apenas metadados. Senha e celular ficam protegidos fora do cliente."
    >
      <div className="space-y-4">
        {accounts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
            Nenhuma conta externa cadastrada ainda.
          </div>
        ) : (
          accounts.map((account) => (
            <article
              key={account.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{account.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Celular mascarado: {account.phoneMasked || 'Nao informado'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={account.status}>{account.status}</StatusBadge>
                  <StatusBadge status={account.sessionStatus}>
                    {account.sessionStatus ?? 'pending'}
                  </StatusBadge>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <p>
                  <strong className="text-white">Sessao:</strong> {account.sessionMode ?? 'browser-persisted'}
                </p>
                <p>
                  <strong className="text-white">Runner:</strong> {account.runnerStatus ?? 'idle'}
                </p>
                <p>
                  <strong className="text-white">Credencial atualizada:</strong>{' '}
                  {formatDateTime(account.lastCredentialUpdateAt)}
                </p>
                <p>
                  <strong className="text-white">Ultima execucao:</strong>{' '}
                  {formatDateTime(account.lastExecutionAt)}
                </p>
              </div>

              {account.notes ? (
                <p className="mt-4 text-sm leading-6 text-slate-400">{account.notes}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                  onClick={() => onEdit(account)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
                  disabled={isSubmitting}
                  onClick={() => onDelete(account.id)}
                >
                  Remover
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  )
}

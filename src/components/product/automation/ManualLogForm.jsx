import { SectionCard } from '../../ui/SectionCard'

export function ManualLogForm({
  accounts,
  canCreateLog,
  form,
  isSubmitting,
  onChange,
  onSubmit,
}) {
  return (
    <SectionCard
      title="Registrar log manual"
      description="Use logs manuais para validar fluxo, cronometros e pontos de observabilidade antes do executor."
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Conta externa</span>
          <select
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="externalAccountId"
            value={form.externalAccountId}
            onChange={onChange}
          >
            <option value="">Selecione</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Tipo</span>
            <select
              className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
              name="type"
              value={form.type}
              onChange={onChange}
            >
              <option value="manual">Manual</option>
              <option value="claimable">Claimable</option>
              <option value="plus">Plus</option>
              <option value="3hours">3Hours</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Status</span>
            <select
              className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
              name="status"
              value={form.status}
              onChange={onChange}
            >
              <option value="pending">Pendente</option>
              <option value="success">Sucesso</option>
              <option value="failed">Falha</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Mensagem</span>
          <textarea
            className="min-h-28 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="message"
            value={form.message}
            onChange={onChange}
            placeholder="Ex.: Claimable confirmado e proximo ciclo agendado para 14:30."
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canCreateLog || isSubmitting}
        >
          Registrar log
        </button>
      </form>
    </SectionCard>
  )
}

import { SectionCard } from '../../ui/SectionCard'

export function AutomationTaskForm({
  accounts,
  canSaveTask,
  form,
  isSubmitting,
  onChange,
  onReset,
  onSubmit,
}) {
  return (
    <SectionCard
      title={form.id ? 'Editar tarefa' : 'Nova tarefa'}
      description="Prepare a sequencia operacional e os limites antes de entregar o ciclo para o agente externo."
      className="overflow-hidden"
      actions={
        form.id ? (
          <button
            type="button"
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
            onClick={onReset}
          >
            Cancelar
          </button>
        ) : null
      }
    >
      <form className="grid gap-4 xl:grid-cols-12" onSubmit={onSubmit}>
        <label className="grid gap-2 xl:col-span-12">
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

        <label className="grid gap-2 xl:col-span-3">
          <span className="text-sm font-medium text-slate-200">Valor do Plus</span>
          <input
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="plusAmount"
            type="number"
            min="0"
            value={form.plusAmount}
            onChange={onChange}
          />
        </label>

        <label className="grid gap-2 xl:col-span-3">
          <span className="text-sm font-medium text-slate-200">Saldo minimo para 3Hours</span>
          <input
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="minAvailableBalance"
            type="number"
            min="0"
            value={form.minAvailableBalance}
            onChange={onChange}
          />
        </label>

        <label className="grid gap-2 xl:col-span-2">
          <span className="text-sm font-medium text-slate-200">Ciclo em horas</span>
          <input
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="cycleHours"
            type="number"
            min="1"
            value={form.cycleHours}
            onChange={onChange}
          />
        </label>

        <label className="grid gap-2 xl:col-span-2">
          <span className="text-sm font-medium text-slate-200">Prioridade</span>
          <input
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="priority"
            type="number"
            min="1"
            value={form.priority}
            onChange={onChange}
          />
        </label>

        <label className="grid gap-2 xl:col-span-2">
          <span className="text-sm font-medium text-slate-200">Status</span>
          <select
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="status"
            value={form.status}
            onChange={onChange}
          >
            <option value="draft">Rascunho</option>
            <option value="active">Ativa</option>
            <option value="paused">Pausada</option>
          </select>
        </label>

        <label className="grid gap-2 xl:col-span-4">
          <span className="text-sm font-medium text-slate-200">Proximo horario</span>
          <input
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="nextRunAt"
            type="datetime-local"
            value={form.nextRunAt}
            onChange={onChange}
          />
        </label>

        <label className="grid gap-2 xl:col-span-12">
          <span className="text-sm font-medium text-slate-200">Observacoes</span>
          <textarea
            className="min-h-28 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="Descreva o comportamento esperado, limitadores e alertas."
          />
        </label>

        <div className="grid gap-3 rounded-3xl border border-sky-400/15 bg-sky-500/5 p-4 xl:col-span-12 xl:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              Ordem
            </p>
            <p className="mt-2 text-sm text-slate-300">Plus {'->'} 3Hours {'->'} Claimable</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              Modo
            </p>
            <p className="mt-2 text-sm text-slate-300">Validacao de fluxo com sessao persistida</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              Destino
            </p>
            <p className="mt-2 text-sm text-slate-300">Painel Vercel + agente externo desacoplado</p>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 xl:col-span-12"
          disabled={!canSaveTask || isSubmitting}
        >
          {form.id ? 'Salvar tarefa' : 'Criar tarefa'}
        </button>
      </form>
    </SectionCard>
  )
}

import { SectionCard } from '../../ui/SectionCard'
import { PasswordInput } from '../../ui/PasswordInput'

export function ExternalAccountForm({
  canSubmit,
  error,
  feedback,
  form,
  isEditing,
  isSubmitting,
  onChange,
  onReset,
  onSubmit,
}) {
  return (
    <SectionCard
      title={isEditing ? 'Editar conta externa' : 'Nova conta externa'}
      description="Credenciais ficam criptografadas no servidor. O cliente visualiza apenas metadados e estado da sessao."
      actions={
        isEditing ? (
          <button
            type="button"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            onClick={onReset}
          >
            Cancelar edicao
          </button>
        ) : null
      }
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Nome da conta</span>
          <input
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-sky-400/70 focus:bg-slate-950"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Ex.: Conta principal Renato"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Celular</span>
          <input
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-sky-400/70 focus:bg-slate-950"
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder={isEditing ? 'Preencha apenas se for trocar o celular' : '5599999999999'}
          />
        </label>

        <PasswordInput
          description="Criptografada"
          name="password"
          onChange={onChange}
          placeholder={isEditing ? 'Preencha apenas se for trocar a senha' : 'Senha da conta'}
          value={form.password}
        />

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Status</span>
          <select
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition focus:border-sky-400/70 focus:bg-slate-950"
            name="status"
            value={form.status}
            onChange={onChange}
          >
            <option value="active">Ativa</option>
            <option value="paused">Pausada</option>
            <option value="archived">Arquivada</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Observacoes</span>
          <textarea
            className="min-h-28 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-sky-400/70 focus:bg-slate-950"
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="Use este campo para identificar a conta, origem ou observacoes operacionais."
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Cadastrar conta'}
        </button>
      </form>

      <div className="mt-4 space-y-2 text-sm">
        {feedback ? <p className="text-sky-200">{feedback}</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
      </div>
    </SectionCard>
  )
}

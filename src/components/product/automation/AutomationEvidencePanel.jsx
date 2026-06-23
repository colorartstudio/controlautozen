import { useState } from 'react'
import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import { formatDateTime } from '../../../utils/productFormatters'

function toTimestamp(value) {
  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value
        ? new Date(value)
        : null

  if (!date || Number.isNaN(date.getTime())) {
    return 0
  }

  return date.getTime()
}

function sortByLastInspection(tasks) {
  return [...tasks].sort(
    (left, right) => toTimestamp(right.lastInspectionAt) - toTimestamp(left.lastInspectionAt),
  )
}

function renderFlag(value) {
  if (value === undefined || value === null) {
    return '-'
  }

  return value ? 'Sim' : 'Nao'
}

export function AutomationEvidencePanel({ tasks }) {
  const [copiedPath, setCopiedPath] = useState('')
  const evidenceTasks = sortByLastInspection(tasks).filter(
    (task) => task.lastInspectionAt || task.lastEvidencePath || task.lastInspectionSummary,
  )

  async function handleCopy(path) {
    if (!path || !navigator?.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(path)
      setCopiedPath(path)

      window.setTimeout(() => {
        setCopiedPath((current) => (current === path ? '' : current))
      }, 1800)
    } catch {
      setCopiedPath('')
    }
  }

  return (
    <SectionCard
      title="Ultima evidencia"
      description="Resumo compacto das leituras reais da tela para suporte, comparacao e depuracao das contas."
    >
      <div className="space-y-3">
        {evidenceTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
            Nenhuma evidencia registrada ainda.
          </div>
        ) : (
          evidenceTasks.slice(0, 6).map((task) => (
            <article
              key={task.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{task.externalAccountName}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {formatDateTime(task.lastInspectionAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={task.tradeScreenVisible ? 'success' : 'pending'}>
                    {task.tradeScreenVisible ? 'trade ok' : 'sem leitura'}
                  </StatusBadge>
                  <StatusBadge status={task.claimableVisible ? 'pending' : 'idle'}>
                    {task.claimableVisible ? 'claimable' : 'sem claim'}
                  </StatusBadge>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <p>
                  <strong className="text-white">Disponivel:</strong> {task.availableUsd || '-'} USD
                </p>
                <p>
                  <strong className="text-white">Limite:</strong> {task.tradingLimitUsd || '-'} USD
                </p>
                <p>
                  <strong className="text-white">Plus:</strong> {renderFlag(task.plusVisible)} ·{' '}
                  <strong className="text-white">3Hours:</strong> {renderFlag(task.threeHoursVisible)}
                </p>
                <p>
                  <strong className="text-white">Claimable:</strong> {renderFlag(task.claimableVisible)} ·{' '}
                  <strong className="text-white">Confirm:</strong> {renderFlag(task.confirmVisible)}
                </p>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                {task.lastInspectionSummary || 'Sem resumo registrado.'}
              </p>

              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3">
                <p className="break-all text-xs text-slate-400">
                  {task.lastEvidencePath || 'Sem caminho de evidencia ainda.'}
                </p>
                {task.lastEvidencePath ? (
                  <button
                    type="button"
                    className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-100 transition hover:bg-white/10"
                    onClick={() => handleCopy(task.lastEvidencePath)}
                  >
                    {copiedPath === task.lastEvidencePath ? 'Caminho copiado' : 'Copiar caminho'}
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  )
}

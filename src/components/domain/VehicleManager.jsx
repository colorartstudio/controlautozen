import { useEffect, useMemo, useState } from 'react'
import { createVehicle, deleteVehicle, subscribeToVehicles, updateVehicle } from '../../services/vehicles'
import { normalizePlate } from '../../utils/formFormatters'

const INITIAL_FORM = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  status: 'active',
  notes: '',
}

export function VehicleManager({ session }) {
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!session.isAuthenticated) {
      setVehicles([])
      return undefined
    }

    return subscribeToVehicles({
      ownerId: session.authUser.uid,
      isAdmin: session.isAdmin,
      next: setVehicles,
      error: (error) => setError(error.message),
    })
  }, [session.authUser?.uid, session.isAdmin, session.isAuthenticated])

  const title = useMemo(
    () => (session.isAdmin ? 'Veiculos de todos os usuarios' : 'Meus veiculos'),
    [session.isAdmin],
  )

  if (!session.isAuthenticated) {
    return (
      <section className="card card--span-2">
        <h2>Veiculos</h2>
        <p className="muted-text">Entre para cadastrar e consultar veiculos.</p>
      </section>
    )
  }

  function handleChange(event) {
    const { name, value } = event.target
    setError('')
    setForm((current) => ({
      ...current,
      [name]: name === 'plate' ? normalizePlate(value) : value,
    }))
  }

  function editVehicle(vehicle) {
    setEditingId(vehicle.id)
    setError('')
    setFeedback('')
    setForm({
      plate: vehicle.plate ?? '',
      brand: vehicle.brand ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year ?? '',
      color: vehicle.color ?? '',
      status: vehicle.status ?? 'active',
      notes: vehicle.notes ?? '',
    })
  }

  function resetForm() {
    setEditingId('')
    setForm(INITIAL_FORM)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback('')
    setError('')

    if (!form.plate || form.plate.length < 7) {
      setError('Informe uma placa valida com 7 caracteres.')
      return
    }

    if (!form.brand.trim() || !form.model.trim()) {
      setError('Marca e modelo sao obrigatorios.')
      return
    }

    setIsSaving(true)

    try {
      if (editingId) {
        await updateVehicle(editingId, form)
        setFeedback('Veiculo atualizado com sucesso.')
      } else {
        await createVehicle(session.authUser.uid, form)
        setFeedback('Veiculo criado com sucesso.')
      }

      resetForm()
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id) {
    setFeedback('')
    setError('')
    setIsSaving(true)

    try {
      await deleteVehicle(id)
      setFeedback('Veiculo removido com sucesso.')
      if (editingId === id) {
        resetForm()
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="card card--span-2">
      <div className="card__header">
        <div>
          <h2>Veiculos</h2>
          <p className="muted-text">{title}. Admin enxerga todos, usuario enxerga apenas os seus.</p>
        </div>
        <span className="badge badge--ok">{vehicles.length} registros</span>
      </div>

      <div className="directory-layout">
        <div className="directory-list">
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              className={vehicle.id === editingId ? 'directory-item directory-item--active' : 'directory-item'}
              onClick={() => editVehicle(vehicle)}
            >
              <strong>{vehicle.plate}</strong>
              <span>{vehicle.brand} {vehicle.model}</span>
              {session.isAdmin && <span>Dono: {vehicle.ownerId}</span>}
            </button>
          ))}
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Placa</span>
            <input name="plate" value={form.plate} onChange={handleChange} placeholder="ABC1D23" />
          </label>
          <label className="field">
            <span>Marca</span>
            <input name="brand" value={form.brand} onChange={handleChange} placeholder="Toyota" />
          </label>
          <label className="field">
            <span>Modelo</span>
            <input name="model" value={form.model} onChange={handleChange} placeholder="Corolla" />
          </label>
          <label className="field">
            <span>Ano</span>
            <input name="year" value={form.year} onChange={handleChange} placeholder="2024" />
          </label>
          <label className="field">
            <span>Cor</span>
            <input name="color" value={form.color} onChange={handleChange} placeholder="Preto" />
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">active</option>
              <option value="maintenance">maintenance</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <label className="field field--full">
            <span>Observacoes</span>
            <textarea name="notes" rows="4" value={form.notes} onChange={handleChange} />
          </label>
          <div className="actions-row">
            <button type="submit" className="button" disabled={isSaving}>
              {editingId ? 'Salvar veiculo' : 'Criar veiculo'}
            </button>
            <button type="button" className="button button--secondary" onClick={resetForm}>
              Novo
            </button>
            {editingId && (
              <button
                type="button"
                className="button button--ghost"
                disabled={isSaving}
                onClick={() => handleDelete(editingId)}
              >
                Remover
              </button>
            )}
          </div>
        </form>
      </div>

      {feedback && <p className="feedback">{feedback}</p>}
      {error && <p className="feedback feedback--error">{error}</p>}
    </section>
  )
}

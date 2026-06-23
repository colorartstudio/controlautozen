import { useEffect, useMemo, useState } from 'react'
import {
  createAppointment,
  deleteAppointment,
  subscribeToAppointments,
  updateAppointment,
} from '../../services/appointments'

const INITIAL_FORM = {
  title: '',
  date: '',
  time: '',
  vehiclePlate: '',
  location: '',
  status: 'pending',
  notes: '',
}

export function AppointmentManager({ session }) {
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!session.isAuthenticated) {
      setAppointments([])
      return undefined
    }

    return subscribeToAppointments({
      ownerId: session.authUser.uid,
      isAdmin: session.isAdmin,
      next: setAppointments,
      error: (error) => setError(error.message),
    })
  }, [session.authUser?.uid, session.isAdmin, session.isAuthenticated])

  const title = useMemo(
    () => (session.isAdmin ? 'Agendamentos de todos os usuarios' : 'Meus agendamentos'),
    [session.isAdmin],
  )

  if (!session.isAuthenticated) {
    return (
      <section className="card card--span-2">
        <h2>Agendamentos</h2>
        <p className="muted-text">Entre para cadastrar e consultar agendamentos.</p>
      </section>
    )
  }

  function handleChange(event) {
    const { name, value } = event.target
    setError('')
    setForm((current) => ({ ...current, [name]: value }))
  }

  function editAppointment(item) {
    setEditingId(item.id)
    setError('')
    setFeedback('')
    setForm({
      title: item.title ?? '',
      date: item.date ?? '',
      time: item.time ?? '',
      vehiclePlate: item.vehiclePlate ?? '',
      location: item.location ?? '',
      status: item.status ?? 'pending',
      notes: item.notes ?? '',
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

    if (!form.title.trim()) {
      setError('Informe um titulo para o agendamento.')
      return
    }

    if (!form.date || !form.time) {
      setError('Informe data e horario do agendamento.')
      return
    }

    setIsSaving(true)

    try {
      if (editingId) {
        await updateAppointment(editingId, form)
        setFeedback('Agendamento atualizado com sucesso.')
      } else {
        await createAppointment(session.authUser.uid, form)
        setFeedback('Agendamento criado com sucesso.')
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
      await deleteAppointment(id)
      setFeedback('Agendamento removido com sucesso.')
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
          <h2>Agendamentos</h2>
          <p className="muted-text">{title}. Admin enxerga todos, usuario enxerga apenas os seus.</p>
        </div>
        <span className="badge badge--ok">{appointments.length} registros</span>
      </div>

      <div className="directory-layout">
        <div className="directory-list">
          {appointments.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === editingId ? 'directory-item directory-item--active' : 'directory-item'}
              onClick={() => editAppointment(item)}
            >
              <strong>{item.title}</strong>
              <span>{item.date} {item.time}</span>
              {item.vehiclePlate && <span>Veiculo: {item.vehiclePlate}</span>}
              {session.isAdmin && <span>Dono: {item.ownerId}</span>}
            </button>
          ))}
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Titulo</span>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Troca de oleo" />
          </label>
          <label className="field">
            <span>Data</span>
            <input type="date" name="date" value={form.date} onChange={handleChange} />
          </label>
          <label className="field">
            <span>Horario</span>
            <input type="time" name="time" value={form.time} onChange={handleChange} />
          </label>
          <label className="field">
            <span>Placa vinculada</span>
            <input
              name="vehiclePlate"
              value={form.vehiclePlate}
              onChange={handleChange}
              placeholder="ABC1D23"
            />
          </label>
          <label className="field">
            <span>Local</span>
            <input name="location" value={form.location} onChange={handleChange} placeholder="Oficina central" />
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="done">done</option>
              <option value="canceled">canceled</option>
            </select>
          </label>
          <label className="field field--full">
            <span>Observacoes</span>
            <textarea name="notes" rows="4" value={form.notes} onChange={handleChange} />
          </label>
          <div className="actions-row">
            <button type="submit" className="button" disabled={isSaving}>
              {editingId ? 'Salvar agendamento' : 'Criar agendamento'}
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

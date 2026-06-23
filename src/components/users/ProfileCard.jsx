import { useEffect, useState } from 'react'
import { updateOwnProfile } from '../../services/users'
import { formatPhone, isPhoneValid } from '../../utils/formFormatters'

export function ProfileCard({ session }) {
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    photoURL: '',
  })
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm({
      displayName: session.profile?.displayName ?? '',
      phone: session.profile?.phone ?? '',
      photoURL: session.profile?.photoURL ?? '',
    })
  }, [session.profile])

  if (!session.isAuthenticated) {
    return (
      <section className="card">
        <h2>Meu perfil</h2>
        <p className="muted-text">Entre na aplicacao para editar seus dados.</p>
      </section>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback('')
    setError('')

    if (!form.displayName.trim()) {
      setError('Informe um nome para o perfil.')
      return
    }

    if (!isPhoneValid(form.phone)) {
      setError('Telefone invalido. Use DDD e numero.')
      return
    }

    setIsSaving(true)

    try {
      await updateOwnProfile(session.authUser.uid, form)
      setFeedback('Perfil atualizado com sucesso.')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setError('')
    setForm((current) => ({
      ...current,
      [name]: name === 'phone' ? formatPhone(value) : value,
    }))
  }

  return (
    <section className="card">
      <h2>Meu perfil</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome exibido</span>
          <input name="displayName" value={form.displayName} onChange={handleChange} />
        </label>

        <label className="field">
          <span>Telefone</span>
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>

        <label className="field">
          <span>Foto URL</span>
          <input name="photoURL" value={form.photoURL} onChange={handleChange} />
        </label>

        <div className="inline-details">
          <span>
            <strong>Papel:</strong> {session.profile?.role ?? 'user'}
          </span>
          <span>
            <strong>Status:</strong> {session.profile?.status ?? 'active'}
          </span>
        </div>

        <button type="submit" className="button" disabled={isSaving}>
          Salvar perfil
        </button>
      </form>

      {feedback && <p className="feedback">{feedback}</p>}
      {error && <p className="feedback feedback--error">{error}</p>}
    </section>
  )
}

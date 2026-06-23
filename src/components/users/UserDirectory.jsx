import { useEffect, useState } from 'react'
import {
  deleteUserProfile,
  subscribeToUsers,
  updateUserAsAdmin,
} from '../../services/users'

export function UserDirectory({ session }) {
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!session.isAdmin) {
      setUsers([])
      setSelectedId('')
      return undefined
    }

    return subscribeToUsers(
      (items) => {
        setUsers(items)
        setSelectedId((current) => current || items[0]?.id || '')
      },
      (error) => setFeedback(error.message),
    )
  }, [session.isAdmin])

  if (!session.isAuthenticated) {
    return (
      <section className="card card--span-2">
        <h2>Diretorio de usuarios</h2>
        <p className="muted-text">Faça login para consultar os perfis.</p>
      </section>
    )
  }

  if (!session.isAdmin) {
    return (
      <section className="card card--span-2">
        <h2>Diretorio de usuarios</h2>
        <p className="muted-text">
          Perfis completos e gestao de papeis ficam disponiveis apenas para administradores.
        </p>
      </section>
    )
  }

  const selectedUser = users.find((user) => user.id === selectedId)

  async function handleSave(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setFeedback('')
    setIsSaving(true)

    try {
      await updateUserAsAdmin(selectedId, {
        displayName: formData.get('displayName'),
        phone: formData.get('phone'),
        photoURL: formData.get('photoURL'),
        notes: formData.get('notes'),
      })
      setFeedback('Perfil salvo com sucesso.')
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedId || selectedId === session.authUser.uid) {
      setFeedback('Nao remova o proprio perfil ativo por esta tela.')
      return
    }

    setFeedback('')
    setIsSaving(true)

    try {
      await deleteUserProfile(selectedId)
      setFeedback('Perfil removido do Firestore. A conta Auth continua existindo.')
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="card card--span-2">
      <div className="card__header">
        <div>
          <h2>Diretorio de usuarios</h2>
          <p className="muted-text">
            Administradores podem revisar perfis e manter dados complementares.
          </p>
        </div>
        <span className="badge badge--ok">{users.length} perfis</span>
      </div>

      <div className="directory-layout">
        <div className="directory-list">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className={user.id === selectedId ? 'directory-item directory-item--active' : 'directory-item'}
              onClick={() => setSelectedId(user.id)}
            >
              <strong>{user.displayName || user.email || user.id}</strong>
              <span>{user.role}</span>
            </button>
          ))}
        </div>

        {selectedUser && (
          <form className="form-grid" onSubmit={handleSave}>
            <label className="field">
              <span>Nome exibido</span>
              <input name="displayName" defaultValue={selectedUser.displayName ?? ''} />
            </label>

            <label className="field">
              <span>Telefone</span>
              <input name="phone" defaultValue={selectedUser.phone ?? ''} />
            </label>

            <label className="field">
              <span>Foto URL</span>
              <input name="photoURL" defaultValue={selectedUser.photoURL ?? ''} />
            </label>

            <label className="field">
              <span>Papel atual</span>
              <input value={selectedUser.role ?? 'user'} disabled readOnly />
            </label>

            <label className="field">
              <span>Status atual</span>
              <input value={selectedUser.status ?? 'active'} disabled readOnly />
            </label>

            <label className="field field--full">
              <span>Observacoes</span>
              <textarea name="notes" rows="4" defaultValue={selectedUser.notes ?? ''} />
            </label>

            <div className="actions-row">
              <button type="submit" className="button" disabled={isSaving}>
                Salvar alteracoes
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Remover perfil
              </button>
            </div>
          </form>
        )}
      </div>

      {feedback && <p className="feedback">{feedback}</p>}
    </section>
  )
}

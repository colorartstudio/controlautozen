import { firebaseConfigStatus, isFirebaseConfigured } from '../../config/env'

const fieldLabels = {
  apiKey: 'API Key',
  authDomain: 'Auth Domain',
  databaseURL: 'Database URL',
  projectId: 'Project ID',
  storageBucket: 'Storage Bucket',
  messagingSenderId: 'Messaging Sender ID',
  appId: 'App ID',
  measurementId: 'Measurement ID',
}

export function FirebaseStatusCard() {
  return (
    <section className="card">
      <div className="card__header">
        <h2>Configuração Firebase</h2>
        <span className={isFirebaseConfigured ? 'badge badge--ok' : 'badge'}>
          {isFirebaseConfigured ? 'Pronto' : 'Pendente'}
        </span>
      </div>
      <p>
        A aplicação sobe mesmo sem credenciais, mas a integração só ativa quando
        todas as variáveis do `.env` estiverem preenchidas.
      </p>
      <ul className="status-list">
        {Object.entries(firebaseConfigStatus).map(([key, isReady]) => (
          <li key={key}>
            <strong>{fieldLabels[key]}:</strong> {isReady ? 'OK' : 'Faltando'}
          </li>
        ))}
      </ul>
    </section>
  )
}

import { FirebaseStatusCard } from '../components/firebase/FirebaseStatusCard'
import { FirebaseStepsCard } from '../components/firebase/FirebaseStepsCard'
import { getAuthAvailability } from '../services/auth'
import { getFirestoreAvailability } from '../services/firestore'

export function HomePage() {
  const auth = getAuthAvailability()
  const firestore = getFirestoreAvailability()

  return (
    <div className="grid">
      <FirebaseStatusCard />
      <FirebaseStepsCard />
      <section className="card">
        <h2>Servicos ativos</h2>
        <ul className="status-list">
          <li>
            <strong>Authentication:</strong> {auth.ready ? 'Conectado' : 'Aguardando configuracao'}
          </li>
          <li>
            <strong>Firestore:</strong> {firestore.ready ? 'Conectado' : 'Aguardando configuracao'}
          </li>
        </ul>
      </section>
      <section className="card">
        <h2>Estrutura sugerida</h2>
        <ul className="status-list">
          <li>`src/app` centraliza a composicao principal.</li>
          <li>`src/components` guarda blocos reutilizaveis.</li>
          <li>`src/pages` concentra telas e fluxo.</li>
          <li>`src/services` isola Auth e Firestore.</li>
          <li>`src/config` e `src/lib` mantem ambiente e bootstrap.</li>
        </ul>
      </section>
    </div>
  )
}

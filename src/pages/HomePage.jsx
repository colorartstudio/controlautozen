import { AdminAccessCard } from '../components/admin/AdminAccessCard'
import { AuthPanel } from '../components/auth/AuthPanel'
import { AppointmentManager } from '../components/domain/AppointmentManager'
import { VehicleManager } from '../components/domain/VehicleManager'
import { FirebaseStatusCard } from '../components/firebase/FirebaseStatusCard'
import { SecurityRulesCard } from '../components/firebase/SecurityRulesCard'
import { FirebaseStepsCard } from '../components/firebase/FirebaseStepsCard'
import { ProfileCard } from '../components/users/ProfileCard'
import { UserDirectory } from '../components/users/UserDirectory'
import { useAuth } from '../hooks/useAuth'
import { getAnalyticsAvailability } from '../services/analytics'
import { getAuthAvailability } from '../services/auth'
import { getFirestoreAvailability } from '../services/firestore'
import { getRealtimeAvailability } from '../services/realtime'

export function HomePage() {
  const session = useAuth()
  const analytics = getAnalyticsAvailability()
  const auth = getAuthAvailability()
  const firestore = getFirestoreAvailability()
  const realtime = getRealtimeAvailability()

  return (
    <div className="grid">
      <AuthPanel session={session} />
      <FirebaseStatusCard />
      <ProfileCard session={session} />
      <AdminAccessCard session={session} />
      <UserDirectory session={session} />
      <VehicleManager session={session} />
      <AppointmentManager session={session} />
      <SecurityRulesCard session={session} />
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
          <li>
            <strong>Realtime Database:</strong> {realtime.ready ? 'Conectado' : 'Aguardando configuracao'}
          </li>
          <li>
            <strong>Analytics:</strong> {analytics.ready ? 'Conectado' : analytics.status}
          </li>
          <li>
            <strong>Sessao atual:</strong> {session.isAuthenticated ? 'Autenticado' : 'Visitante'}
          </li>
        </ul>
      </section>
      <section className="card">
        <h2>Estrutura sugerida</h2>
        <ul className="status-list">
          <li>`src/app` centraliza a composicao principal.</li>
          <li>`src/components` guarda blocos reutilizaveis.</li>
          <li>`src/pages` concentra telas e fluxo.</li>
          <li>`src/services` isola Auth, Firestore, RTDB e Analytics.</li>
          <li>`src/config` e `src/lib` mantem ambiente e bootstrap.</li>
        </ul>
      </section>
    </div>
  )
}

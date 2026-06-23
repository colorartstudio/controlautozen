import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedLayout } from '../components/layout/ProtectedLayout'
import { AuthProvider } from '../providers/AuthProvider'
import { AccountsPage } from '../pages/AccountsPage'
import { AdminPage } from '../pages/AdminPage'
import { AutomationPage } from '../pages/AutomationPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { SubscriptionPage } from '../pages/SubscriptionPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/contas" element={<AccountsPage />} />
            <Route path="/automacao" element={<AutomationPage />} />
            <Route path="/assinatura" element={<SubscriptionPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

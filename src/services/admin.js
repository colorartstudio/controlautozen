import { callProtectedApi } from './secureApi'

export async function promoteUserRole(uid, role) {
  return callProtectedApi('/api/admin/set-user-role', { uid, role })
}

export async function setAuthDisabledStatus(uid, disabled) {
  return callProtectedApi('/api/admin/set-user-disabled-status', { uid, disabled })
}

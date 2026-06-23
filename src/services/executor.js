import { callProtectedApi } from './secureApi'

export async function runAutomationTask(payload) {
  return callProtectedApi('/api/executor/run-task', payload)
}

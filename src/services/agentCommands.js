import { subscribeToOwnedCollection } from './collectionHelpers'
import { callProtectedApi } from './secureApi'

export function subscribeToAgentCommands({ ownerId, isAdmin, next, error }) {
  return subscribeToOwnedCollection(
    'agentCommands',
    ownerId,
    isAdmin,
    next,
    error,
    { sortField: 'createdAt' },
  )
}

export async function queueAgentCommand(payload) {
  return callProtectedApi('/api/agent/queue-command', payload)
}

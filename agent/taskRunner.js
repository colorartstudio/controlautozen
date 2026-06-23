import { simulateClaimedTask } from './mockValidation.js'

export async function runClaimedWorkItem(context) {
  const mode = context.config.executionMode

  if (mode === 'real') {
    const { runRealClaimedWorkItem } = await import('./realBrowser.js')
    return runRealClaimedWorkItem(context)
  }

  return simulateClaimedTask(context)
}

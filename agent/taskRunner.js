import { simulateClaimedTask } from './mockValidation.js'

export async function runClaimedTask(context) {
  const mode = context.config.executionMode

  if (mode === 'real') {
    const { runRealClaimedTask } = await import('./realBrowser.js')
    return runRealClaimedTask(context)
  }

  return simulateClaimedTask(context)
}

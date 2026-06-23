import fs from 'node:fs'
import path from 'node:path'

function normalizeValue(value) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  const isWrappedInQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))

  if (!isWrappedInQuotes) {
    return trimmed
  }

  return trimmed.slice(1, -1).replace(/\\n/g, '\n')
}

export function loadProjectEnv(projectRoot = process.cwd()) {
  const envPath = path.join(projectRoot, '.env')

  if (!fs.existsSync(envPath)) {
    return {
      envPath,
      loadedKeys: [],
    }
  }

  const content = fs.readFileSync(envPath, 'utf8')
  const loadedKeys = []

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()

    if (!key || process.env[key]) {
      continue
    }

    process.env[key] = normalizeValue(trimmed.slice(separatorIndex + 1))
    loadedKeys.push(key)
  }

  return {
    envPath,
    loadedKeys,
  }
}

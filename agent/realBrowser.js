import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { buildNextRunAt, buildValidationSummary } from './taskResult.js'

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function sanitizeSegment(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')

  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2)
  }

  return digits
}

async function ensureProfileDir(config, externalAccount) {
  const profileDir = path.join(
    config.profileRootDir,
    sanitizeSegment(externalAccount?.id || externalAccount?.name || 'default-account'),
  )

  await fs.mkdir(profileDir, { recursive: true })
  return profileDir
}

async function waitForTradeReady(page, config) {
  const deadline = Date.now() + config.navigationTimeoutMs

  while (Date.now() < deadline) {
    const url = page.url()

    if (
      url.includes('/pages/UITransaction/trade') &&
      !url.includes('/pages/login/login')
    ) {
      return true
    }

    const pageText = await page.locator('body').innerText().catch(() => '')

    if (/claimable|3hours|trade|plus/i.test(pageText)) {
      return true
    }

    await sleep(1000)
  }

  return false
}

async function hasCaptcha(page) {
  const bodyText = await page.locator('body').innerText().catch(() => '')
  return /image captcha|confirmcancel|please enter the image captcha/i.test(bodyText)
}

async function clickIfVisible(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()

    if ((await locator.count()) > 0 && (await locator.isVisible().catch(() => false))) {
      await locator.click()
      return true
    }
  }

  return false
}

async function fillFirstVisible(page, selectors, value) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()

    if ((await locator.count()) > 0 && (await locator.isVisible().catch(() => false))) {
      await locator.fill(value)
      return true
    }
  }

  return false
}

async function waitForManualCaptcha(page, config) {
  if (config.useHeadlessBrowser) {
    throw new Error(
      'Captcha detectado no login real. Execute com AGENT_HEADLESS=false para resolver manualmente.',
    )
  }

  const deadline = Date.now() + config.manualCaptchaWaitMs

  while (Date.now() < deadline) {
    const tradeReady = await waitForTradeReady(page, {
      ...config,
      navigationTimeoutMs: 2500,
    })

    if (tradeReady || !(await hasCaptcha(page))) {
      return
    }

    await sleep(1500)
  }

  throw new Error(
    'Captcha detectado e nao resolvido dentro do tempo configurado para o worker.',
  )
}

async function performLogin(page, externalAccount, config) {
  const credentials = externalAccount?.credentials

  if (!credentials?.phone || !credentials?.password) {
    throw new Error(
      'A conta externa nao possui credenciais completas para login real no agente.',
    )
  }

  const phone = normalizePhone(credentials.phone)
  const password = String(credentials.password)

  await page.goto(config.targetLoginUrl, {
    timeout: config.navigationTimeoutMs,
    waitUntil: 'domcontentloaded',
  })

  await clickIfVisible(page, ['text=MOBILE LOGIN', '.zq-m-tab:has-text("MOBILE LOGIN")'])

  const didFillPhone = await fillFirstVisible(page, ['input[type="number"]'], phone)
  const didFillPassword = await fillFirstVisible(page, ['input[type="password"]'], password)

  if (!didFillPhone || !didFillPassword) {
    throw new Error('Nao foi possivel localizar os campos de celular e senha na tela real.')
  }

  await clickIfVisible(page, ['.zq-cta', 'text=LOGIN'])
  await page.waitForTimeout(2500)

  if (await hasCaptcha(page)) {
    await waitForManualCaptcha(page, config)
  }

  await page.goto(config.targetTradeUrl, {
    timeout: config.navigationTimeoutMs,
    waitUntil: 'domcontentloaded',
  })
}

export async function runRealClaimedTask({ config, externalAccount, task }) {
  const profileDir = await ensureProfileDir(config, externalAccount)
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: config.useHeadlessBrowser,
    viewport: { height: 900, width: 1440 },
  })

  const page = context.pages()[0] ?? (await context.newPage())
  page.setDefaultNavigationTimeout(config.navigationTimeoutMs)
  page.setDefaultTimeout(config.loginTimeoutMs)

  try {
    await page.goto(config.targetTradeUrl, {
      timeout: config.navigationTimeoutMs,
      waitUntil: 'domcontentloaded',
    })

    const tradeReadyBeforeLogin = await waitForTradeReady(page, config)

    if (!tradeReadyBeforeLogin) {
      await performLogin(page, externalAccount, config)
    }

    const tradeReady = await waitForTradeReady(page, config)

    if (!tradeReady) {
      throw new Error('Nao foi possivel validar a navegacao ate a tela de trade.')
    }

    const validationSummary = buildValidationSummary({
      externalAccount,
      prefix: 'Login real concluido e tela de trade validada',
      task,
      validationStatus: 'success',
    })

    return {
      lastError: '',
      logs: [
        {
          message: `Perfil persistente carregado em ${profileDir}.`,
          source: 'agent',
          status: 'success',
          taskId: task.id,
          type: 'session',
        },
        {
          message: 'Login real confirmado e navegacao ate o trade validada.',
          source: 'agent',
          status: 'success',
          taskId: task.id,
          type: 'navigation',
        },
      ],
      nextRunAt: buildNextRunAt(task),
      sessionStatus: 'connected',
      validationStatus: 'success',
      validationSummary,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida ao validar sessao real no navegador persistente.'

    return {
      lastError: message,
      logs: [
        {
          message,
          source: 'agent',
          status: 'failed',
          taskId: task.id,
          type: 'navigation',
        },
      ],
      nextRunAt: buildNextRunAt(task),
      sessionStatus: 'expired_session',
      validationStatus: 'failed',
      validationSummary: message,
    }
  } finally {
    await context.close()
  }
}

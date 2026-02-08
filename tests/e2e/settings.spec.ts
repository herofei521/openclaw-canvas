import { expect, test, _electron as electron } from '@playwright/test'
import path from 'path'

const electronAppPath = path.resolve(__dirname, '../../')
const storageKey = 'cove:m0:workspace-state'

test.describe('Settings', () => {
  test('persists agent provider, model override, and claude connection config', async () => {
    const electronApp = await electron.launch({
      args: [electronAppPath],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        COVE_TEST_WORKSPACE: path.resolve(__dirname, '../../'),
      },
    })

    const window = await electronApp.firstWindow()

    try {
      await window.waitForLoadState('domcontentloaded')
      await window.evaluate(key => {
        window.localStorage.removeItem(key)
      }, storageKey)
      await window.reload({ waitUntil: 'domcontentloaded' })

      const settingsButton = window.locator('.workspace-sidebar__settings')
      await expect(settingsButton).toBeVisible()
      await settingsButton.click()

      const defaultProvider = window.locator('#settings-default-provider')
      await expect(defaultProvider).toBeVisible()
      await defaultProvider.selectOption('codex')

      const customModelEnabled = window.locator(
        '[data-testid="settings-custom-model-enabled-codex"]',
      )
      await customModelEnabled.check()

      const customModelInput = window.locator('[data-testid="settings-custom-model-input-codex"]')
      await customModelInput.fill('gpt-5.2-codex')

      await window.locator('#settings-default-provider').selectOption('claude-code')
      const claudeBaseUrl = window.locator('[data-testid="settings-claude-base-url"]')
      await claudeBaseUrl.fill('https://proxy.example.com')
      const claudeApiKey = window.locator('[data-testid="settings-claude-api-key"]')
      await claudeApiKey.fill('test-api-key')

      await window.locator('.settings-panel__close').click()
      await expect(window.locator('.workspace-sidebar__agent-provider')).toHaveText('Claude Code')
      await expect(window.locator('.workspace-sidebar__agent-model')).toHaveText(
        'Default (Follow CLI)',
      )

      await window.reload({ waitUntil: 'domcontentloaded' })
      await expect(window.locator('.workspace-sidebar__agent-provider')).toHaveText('Claude Code')
      await expect(window.locator('.workspace-sidebar__agent-model')).toHaveText(
        'Default (Follow CLI)',
      )

      const persistedSettings = await window.evaluate(key => {
        const raw = window.localStorage.getItem(key)
        if (!raw) {
          return null
        }

        const parsed = JSON.parse(raw) as {
          settings?: {
            defaultProvider?: string
            customModelEnabledByProvider?: {
              codex?: boolean
            }
            customModelByProvider?: {
              codex?: string
            }
            claudeConnection?: {
              baseUrl?: string
              apiKey?: string
            }
          }
        }

        return parsed.settings ?? null
      }, storageKey)

      expect(persistedSettings?.defaultProvider).toBe('claude-code')
      expect(persistedSettings?.customModelEnabledByProvider?.codex).toBe(true)
      expect(persistedSettings?.customModelByProvider?.codex).toBe('gpt-5.2-codex')
      expect(persistedSettings?.claudeConnection?.baseUrl).toBe('https://proxy.example.com')
      expect(persistedSettings?.claudeConnection?.apiKey).toBe('test-api-key')
    } finally {
      await electronApp.close()
    }
  })
})

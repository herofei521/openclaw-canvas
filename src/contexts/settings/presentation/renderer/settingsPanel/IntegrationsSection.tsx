import React, { useState, useCallback } from 'react'
import { useTranslation } from '@app/renderer/i18n'
import type { OpenClawApiConfig } from '@contexts/settings/domain/agentSettings'

export function IntegrationsSection(props: {
  githubPullRequestsEnabled: boolean
  openclawApi: OpenClawApiConfig
  onChangeGitHubPullRequestsEnabled: (enabled: boolean) => void
  onChangeOpenClawApi: (config: OpenClawApiConfig) => void
  onTestOpenClawConnection: () => Promise<{ success: boolean; message: string; error?: string }>
  onStartOpenClawOAuth: () => Promise<void>
}): React.JSX.Element {
  const {
    githubPullRequestsEnabled,
    openclawApi,
    onChangeGitHubPullRequestsEnabled,
    onChangeOpenClawApi,
    onTestOpenClawConnection,
    onStartOpenClawOAuth,
  } = props
  const { t } = useTranslation()

  // Local state for connection test
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean
    message: string
    timestamp: number
    error?: string
  } | null>(
    openclawApi.lastConnectionTest
      ? {
          success: openclawApi.lastConnectionTest.success,
          message: openclawApi.lastConnectionTest.success ? 'Connected' : 'Connection failed',
          timestamp: openclawApi.lastConnectionTest.timestamp,
          error: openclawApi.lastConnectionTest.error,
        }
      : null
  )

  // Local state for OAuth
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false)

  // Handle Gateway URL change
  const handleGatewayUrlChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = event.target.value.trim()
      // Derive OAuth URLs from gateway URL
      const baseUrl = newUrl.replace(/\/$/, '')
      onChangeOpenClawApi({
        ...openclawApi,
        gatewayUrl: newUrl,
        oauthAuthorizeUrl: baseUrl ? `${baseUrl}/oauth/authorize` : '',
        oauthTokenUrl: baseUrl ? `${baseUrl}/oauth/token` : '',
      })
    },
    [openclawApi, onChangeOpenClawApi],
  )

  // Handle enabled toggle
  const handleEnabledChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeOpenClawApi({
        ...openclawApi,
        enabled: event.target.checked,
      })
    },
    [openclawApi, onChangeOpenClawApi],
  )

  // Handle test connection
  const handleTestConnection = useCallback(async () => {
    if (!openclawApi.gatewayUrl.trim()) {
      setConnectionTestResult({
        success: false,
        message: 'Gateway URL is required',
        timestamp: Date.now(),
        error: 'URL_REQUIRED',
      })
      return
    }

    setIsTestingConnection(true)
    setConnectionTestResult(null)

    try {
      const result = await onTestOpenClawConnection()
      const testResult = {
        success: result.success,
        message: result.message,
        timestamp: Date.now(),
        error: result.error,
      }
      setConnectionTestResult(testResult)
      onChangeOpenClawApi({
        ...openclawApi,
        lastConnectionTest: testResult,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const testResult = {
        success: false,
        message: errorMessage,
        timestamp: Date.now(),
        error: errorMessage,
      }
      setConnectionTestResult(testResult)
      onChangeOpenClawApi({
        ...openclawApi,
        lastConnectionTest: testResult,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }, [openclawApi, onTestOpenClawConnection, onChangeOpenClawApi])

  // Handle OAuth authorization
  const handleStartOAuth = useCallback(async () => {
    if (!openclawApi.gatewayUrl.trim()) {
      return
    }

    setIsOAuthInProgress(true)
    try {
      await onStartOpenClawOAuth()
    } catch (error) {
      console.error('OAuth failed:', error)
    } finally {
      setIsOAuthInProgress(false)
    }
  }, [openclawApi.gatewayUrl, onStartOpenClawOAuth])

  return (
    <div className="settings-panel__section" id="settings-section-integrations">
      <h3 className="settings-panel__section-title">{t('settingsPanel.integrations.title')}</h3>

      {/* OpenClaw API Configuration */}
      <div className="settings-panel__subsection">
        <div className="settings-panel__subsection-header">
          <h4 className="settings-panel__section-title">
            {t('settingsPanel.integrations.openclawApi.title')}
          </h4>
          <span>{t('settingsPanel.integrations.openclawApi.help')}</span>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="settings-panel__row">
          <div className="settings-panel__row-label">
            <strong>{t('settingsPanel.integrations.openclawApi.enabledLabel')}</strong>
            <span>{t('settingsPanel.integrations.openclawApi.enabledHelp')}</span>
          </div>
          <div className="settings-panel__control">
            <label className="cove-toggle">
              <input
                type="checkbox"
                data-testid="settings-openclaw-api-enabled"
                checked={openclawApi.enabled}
                onChange={handleEnabledChange}
              />
              <span className="cove-toggle__slider"></span>
            </label>
          </div>
        </div>

        {/* Gateway URL Input */}
        <div className="settings-panel__row">
          <div className="settings-panel__row-label">
            <strong>{t('settingsPanel.integrations.openclawApi.gatewayUrlLabel')}</strong>
            <span>{t('settingsPanel.integrations.openclawApi.gatewayUrlHelp')}</span>
          </div>
          <div className="settings-panel__control" style={{ alignItems: 'center', gap: '8px' }}>
            <input
              id="settings-openclaw-gateway-url"
              data-testid="settings-openclaw-gateway-url"
              className="cove-field"
              style={{ width: '280px' }}
              type="text"
              placeholder={t('settingsPanel.integrations.openclawApi.gatewayUrlPlaceholder')}
              value={openclawApi.gatewayUrl}
              onChange={handleGatewayUrlChange}
              disabled={!openclawApi.enabled}
            />
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="settings-panel__row">
          <div className="settings-panel__row-label">
            <strong>{t('settingsPanel.integrations.openclawApi.testConnectionLabel')}</strong>
            <span>{t('settingsPanel.integrations.openclawApi.testConnectionHelp')}</span>
          </div>
          <div className="settings-panel__control" style={{ alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="secondary"
              data-testid="settings-openclaw-test-connection"
              onClick={handleTestConnection}
              disabled={!openclawApi.enabled || !openclawApi.gatewayUrl.trim() || isTestingConnection}
            >
              {isTestingConnection
                ? t('settingsPanel.integrations.openclawApi.testing')
                : t('settingsPanel.integrations.openclawApi.testConnection')}
            </button>
            {connectionTestResult && (
              <span
                className={`settings-panel__connection-status ${connectionTestResult.success ? 'settings-panel__connection-status--success' : 'settings-panel__connection-status--error'}`}
                data-testid="settings-openclaw-connection-result"
              >
                {connectionTestResult.success
                  ? t('settingsPanel.integrations.openclawApi.connectionSuccess')
                  : t('settingsPanel.integrations.openclawApi.connectionFailed', {
                      error: connectionTestResult.error || connectionTestResult.message,
                    })}
              </span>
            )}
          </div>
        </div>

        {/* OAuth Authorization */}
        <div className="settings-panel__row">
          <div className="settings-panel__row-label">
            <strong>{t('settingsPanel.integrations.openclawApi.oauthLabel')}</strong>
            <span>{t('settingsPanel.integrations.openclawApi.oauthHelp')}</span>
          </div>
          <div className="settings-panel__control" style={{ alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="primary"
              data-testid="settings-openclaw-oauth-authorize"
              onClick={handleStartOAuth}
              disabled={
                !openclawApi.enabled ||
                !openclawApi.gatewayUrl.trim() ||
                isOAuthInProgress
              }
            >
              {isOAuthInProgress
                ? t('settingsPanel.integrations.openclawApi.authorizing')
                : t('settingsPanel.integrations.openclawApi.authorize')}
            </button>
          </div>
        </div>
      </div>

      {/* GitHub PR Links */}
      <div className="settings-panel__row">
        <div className="settings-panel__row-label">
          <strong>{t('settingsPanel.integrations.githubPullRequestsLabel')}</strong>
          <span>{t('settingsPanel.integrations.githubPullRequestsHelp')}</span>
        </div>
        <div className="settings-panel__control">
          <label className="cove-toggle">
            <input
              type="checkbox"
              data-testid="settings-github-pull-requests-enabled"
              checked={githubPullRequestsEnabled}
              onChange={event => onChangeGitHubPullRequestsEnabled(event.target.checked)}
            />
            <span className="cove-toggle__slider"></span>
          </label>
        </div>
      </div>
    </div>
  )
}
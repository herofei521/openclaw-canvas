import React from 'react'
import { AGENT_PROVIDERS, AGENT_PROVIDER_LABEL, type AgentProvider } from '../../agentConfig'

export function GeneralSection(props: {
  defaultProvider: AgentProvider
  agentFullAccess: boolean
  onChangeDefaultProvider: (provider: AgentProvider) => void
  onChangeAgentFullAccess: (enabled: boolean) => void
}): React.JSX.Element {
  const { defaultProvider, agentFullAccess, onChangeDefaultProvider, onChangeAgentFullAccess } =
    props

  return (
    <div className="settings-panel__section" id="settings-section-general">
      <h3 className="settings-panel__section-title">Provider Settings</h3>

      <div className="settings-panel__row">
        <div className="settings-panel__row-label">
          <strong>Default Agent</strong>
          <span>The default AI provider for new tasks and terminals.</span>
        </div>
        <div className="settings-panel__control">
          <select
            id="settings-default-provider"
            value={defaultProvider}
            onChange={event => {
              onChangeDefaultProvider(event.target.value as AgentProvider)
            }}
          >
            {AGENT_PROVIDERS.map(provider => (
              <option value={provider} key={provider}>
                {AGENT_PROVIDER_LABEL[provider]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-panel__row">
        <div className="settings-panel__row-label">
          <strong>Full Access Mode</strong>
          <span>Disable sandbox and manual approvals for agents.</span>
        </div>
        <div className="settings-panel__control">
          <label className="cove-toggle">
            <input
              type="checkbox"
              data-testid="settings-agent-full-access"
              checked={agentFullAccess}
              onChange={event => onChangeAgentFullAccess(event.target.checked)}
            />
            <span className="cove-toggle__slider"></span>
          </label>
        </div>
      </div>
    </div>
  )
}

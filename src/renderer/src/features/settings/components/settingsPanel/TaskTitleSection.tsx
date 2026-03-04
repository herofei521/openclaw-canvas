import React from 'react'
import {
  AGENT_PROVIDERS,
  AGENT_PROVIDER_LABEL,
  type AgentProvider,
  type TaskTitleProvider,
} from '../../agentConfig'

export function TaskTitleSection(props: {
  defaultProvider: AgentProvider
  taskTitleProvider: TaskTitleProvider
  taskTitleModel: string
  effectiveTaskTitleProvider: AgentProvider
  onChangeTaskTitleProvider: (provider: TaskTitleProvider) => void
  onChangeTaskTitleModel: (model: string) => void
}): React.JSX.Element {
  const {
    defaultProvider,
    taskTitleProvider,
    taskTitleModel,
    effectiveTaskTitleProvider,
    onChangeTaskTitleProvider,
    onChangeTaskTitleModel,
  } = props

  return (
    <div className="settings-panel__section" id="settings-section-task-title">
      <h3 className="settings-panel__section-title">Task Title Generation</h3>

      <div className="settings-panel__row">
        <div className="settings-panel__row-label">
          <strong>CLI Provider</strong>
          <span>Provider used to generate titles for new tasks.</span>
        </div>
        <div className="settings-panel__control">
          <select
            id="settings-task-title-provider"
            data-testid="settings-task-title-provider"
            value={taskTitleProvider}
            onChange={event => {
              onChangeTaskTitleProvider(event.target.value as TaskTitleProvider)
            }}
          >
            <option value="default">
              Follow Default Agent ({AGENT_PROVIDER_LABEL[defaultProvider]})
            </option>
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
          <strong>Model (optional)</strong>
          <span>Override the model used for title generation.</span>
        </div>
        <div className="settings-panel__control">
          <input
            type="text"
            id="settings-task-title-model"
            data-testid="settings-task-title-model"
            value={taskTitleModel}
            placeholder="Follow CLI default"
            onChange={event => {
              onChangeTaskTitleModel(event.target.value)
            }}
          />
        </div>
      </div>

      <div className="settings-panel__row">
        <div className="settings-panel__row-label">
          <strong>Effective Provider</strong>
        </div>
        <div className="settings-panel__control">
          <span style={{ fontSize: '13px', color: '#666' }}>
            {AGENT_PROVIDER_LABEL[effectiveTaskTitleProvider]}
          </span>
        </div>
      </div>
    </div>
  )
}

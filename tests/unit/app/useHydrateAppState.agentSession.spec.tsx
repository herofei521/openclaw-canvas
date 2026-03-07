import React, { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_AGENT_SETTINGS } from '../../../src/renderer/src/features/settings/agentConfig'
import type { WorkspaceState } from '../../../src/renderer/src/features/workspace/types'
import { installMockStorage } from '../workspace/persistenceTestStorage'

function createPersistedState({
  prompt,
  status,
  startedAt,
}: {
  prompt: string
  status: 'running' | 'standby'
  startedAt: string
}) {
  return {
    activeWorkspaceId: 'workspace-1',
    workspaces: [
      {
        id: 'workspace-1',
        name: 'Workspace 1',
        path: '/tmp/workspace-1',
        viewport: { x: 0, y: 0, zoom: 1 },
        isMinimapVisible: false,
        spaces: [],
        activeSpaceId: null,
        nodes: [
          {
            id: 'agent-node-1',
            title: 'codex · gpt-5.2-codex',
            position: { x: 0, y: 0 },
            width: 520,
            height: 360,
            kind: 'agent',
            status,
            startedAt,
            endedAt: null,
            exitCode: null,
            lastError: null,
            scrollback: null,
            agent: {
              provider: 'codex',
              prompt,
              model: 'gpt-5.2-codex',
              effectiveModel: 'gpt-5.2-codex',
              launchMode: 'new',
              resumeSessionId: 'stale-codex-session',
              executionDirectory: '/tmp/workspace-1/agent',
              expectedDirectory: '/tmp/workspace-1/agent',
              directoryMode: 'workspace',
              customDirectory: null,
              shouldCreateDirectory: false,
              taskId: null,
            },
            task: null,
          },
        ],
      },
    ],
    settings: {},
  }
}

function installMockApi({
  spawn,
  launch,
}: {
  spawn: ReturnType<typeof vi.fn>
  launch: ReturnType<typeof vi.fn>
}) {
  Object.defineProperty(window, 'coveApi', {
    configurable: true,
    writable: true,
    value: {
      pty: {
        spawn,
      },
      agent: {
        launch,
      },
    },
  })
}

describe('useHydrateAppState agent session restore', () => {
  it('relaunches a blank persisted codex agent without a verified binding as a new session', async () => {
    const storage = installMockStorage()
    const originalStartedAt = '2026-03-08T09:00:00.000Z'

    storage.setItem(
      'cove:m0:workspace-state',
      JSON.stringify(
        createPersistedState({
          prompt: '',
          status: 'standby',
          startedAt: originalStartedAt,
        }),
      ),
    )

    const spawn = vi.fn(async () => {
      throw new Error('should not fallback to shell for blank agent relaunch')
    })
    const launch = vi.fn(async () => ({
      sessionId: 'relaunched-agent-session',
      provider: 'codex',
      command: 'codex',
      args: [],
      launchMode: 'new' as const,
      effectiveModel: 'gpt-5.2-codex',
      resumeSessionId: null,
    }))

    installMockApi({ spawn, launch })

    const { useHydrateAppState } =
      await import('../../../src/renderer/src/app/hooks/useHydrateAppState')

    function Harness() {
      const [_agentSettings, setAgentSettings] = useState(DEFAULT_AGENT_SETTINGS)
      const [workspaces, setWorkspaces] = useState<WorkspaceState[]>([])
      const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)

      const { isHydrated } = useHydrateAppState({
        setAgentSettings,
        setWorkspaces,
        setActiveWorkspaceId,
      })

      const hydratedAgent = workspaces.find(workspace => workspace.id === 'workspace-1')?.nodes[0]

      return (
        <div>
          <div data-testid="active-workspace">{activeWorkspaceId ?? 'none'}</div>
          <div data-testid="hydrated">{String(isHydrated)}</div>
          <div data-testid="agent-session-id">{hydratedAgent?.data.sessionId ?? ''}</div>
          <div data-testid="agent-status">{hydratedAgent?.data.status ?? 'none'}</div>
          <div data-testid="agent-started-at">{hydratedAgent?.data.startedAt ?? 'none'}</div>
          <div data-testid="agent-resume-session-id">
            {hydratedAgent?.data.agent?.resumeSessionId ?? 'none'}
          </div>
          <div data-testid="agent-resume-session-verified">
            {String(hydratedAgent?.data.agent?.resumeSessionIdVerified ?? false)}
          </div>
        </div>
      )
    }

    render(<Harness />)

    await waitFor(() => {
      expect(screen.getByTestId('active-workspace')).toHaveTextContent('workspace-1')
    })

    await waitFor(() => {
      expect(screen.getByTestId('hydrated')).toHaveTextContent('true')
    })

    expect(launch).toHaveBeenCalledWith({
      provider: 'codex',
      cwd: '/tmp/workspace-1/agent',
      prompt: '',
      mode: 'new',
      model: 'gpt-5.2-codex',
      agentFullAccess: true,
      cols: 80,
      rows: 24,
    })
    expect(spawn).not.toHaveBeenCalled()
    expect(screen.getByTestId('agent-session-id')).toHaveTextContent('relaunched-agent-session')
    expect(screen.getByTestId('agent-status')).toHaveTextContent('standby')
    expect(screen.getByTestId('agent-started-at').textContent).not.toBe(originalStartedAt)
    expect(screen.getByTestId('agent-resume-session-id')).toHaveTextContent('none')
    expect(screen.getByTestId('agent-resume-session-verified')).toHaveTextContent('false')
  })

  it('does not auto-rerun a prompted persisted codex agent without a verified binding', async () => {
    const storage = installMockStorage()

    storage.setItem(
      'cove:m0:workspace-state',
      JSON.stringify(
        createPersistedState({
          prompt: 'implement login flow',
          status: 'running',
          startedAt: '2026-03-08T09:00:00.000Z',
        }),
      ),
    )

    const spawn = vi.fn(async () => ({ sessionId: 'spawned-agent-session' }))
    const launch = vi.fn(async () => {
      throw new Error('should not relaunch a prompted agent without a verified binding')
    })

    installMockApi({ spawn, launch })

    const { useHydrateAppState } =
      await import('../../../src/renderer/src/app/hooks/useHydrateAppState')

    function Harness() {
      const [_agentSettings, setAgentSettings] = useState(DEFAULT_AGENT_SETTINGS)
      const [workspaces, setWorkspaces] = useState<WorkspaceState[]>([])
      const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)

      const { isHydrated } = useHydrateAppState({
        setAgentSettings,
        setWorkspaces,
        setActiveWorkspaceId,
      })

      const hydratedAgent = workspaces.find(workspace => workspace.id === 'workspace-1')?.nodes[0]

      return (
        <div>
          <div data-testid="active-workspace">{activeWorkspaceId ?? 'none'}</div>
          <div data-testid="hydrated">{String(isHydrated)}</div>
          <div data-testid="agent-session-id">{hydratedAgent?.data.sessionId ?? ''}</div>
          <div data-testid="agent-status">{hydratedAgent?.data.status ?? 'none'}</div>
          <div data-testid="agent-resume-session-id">
            {hydratedAgent?.data.agent?.resumeSessionId ?? 'none'}
          </div>
          <div data-testid="agent-resume-session-verified">
            {String(hydratedAgent?.data.agent?.resumeSessionIdVerified ?? false)}
          </div>
        </div>
      )
    }

    render(<Harness />)

    await waitFor(() => {
      expect(screen.getByTestId('active-workspace')).toHaveTextContent('workspace-1')
    })

    await waitFor(() => {
      expect(screen.getByTestId('hydrated')).toHaveTextContent('true')
    })

    expect(launch).not.toHaveBeenCalled()
    expect(spawn).toHaveBeenCalledWith({
      cwd: '/tmp/workspace-1/agent',
      cols: 80,
      rows: 24,
    })
    expect(screen.getByTestId('agent-session-id')).toHaveTextContent('spawned-agent-session')
    expect(screen.getByTestId('agent-status')).toHaveTextContent('stopped')
    expect(screen.getByTestId('agent-resume-session-id')).toHaveTextContent('none')
    expect(screen.getByTestId('agent-resume-session-verified')).toHaveTextContent('false')
  })
})

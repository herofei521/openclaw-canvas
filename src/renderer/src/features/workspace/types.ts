import type { Node } from '@xyflow/react'
import type { AgentSettings, AgentProvider } from '../settings/agentConfig'

export type WorkspaceNodeKind = 'terminal' | 'agent'

export type AgentRuntimeStatus = 'running' | 'exited' | 'failed' | 'stopped' | 'restoring'

export type AgentLaunchMode = 'new' | 'resume'

export type ExecutionDirectoryMode = 'workspace' | 'custom'

export interface AgentNodeData {
  provider: AgentProvider
  prompt: string
  model: string | null
  effectiveModel: string | null
  launchMode: AgentLaunchMode
  resumeSessionId: string | null
  executionDirectory: string
  directoryMode: ExecutionDirectoryMode
  customDirectory: string | null
  shouldCreateDirectory: boolean
}

export interface TerminalNodeData {
  sessionId: string
  title: string
  width: number
  height: number
  kind: WorkspaceNodeKind
  status: AgentRuntimeStatus | null
  startedAt: string | null
  endedAt: string | null
  exitCode: number | null
  lastError: string | null
  agent: AgentNodeData | null
}

export interface WorkspaceState {
  id: string
  name: string
  path: string
  nodes: Node<TerminalNodeData>[]
}

export interface PersistedWorkspaceState {
  id: string
  name: string
  path: string
  nodes: PersistedTerminalNode[]
}

export interface PersistedTerminalNode {
  id: string
  title: string
  position: Point
  width: number
  height: number
  kind: WorkspaceNodeKind
  status: AgentRuntimeStatus | null
  startedAt: string | null
  endedAt: string | null
  exitCode: number | null
  lastError: string | null
  agent: AgentNodeData | null
}

export interface PersistedAppState {
  activeWorkspaceId: string | null
  workspaces: PersistedWorkspaceState[]
  settings: AgentSettings
}

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

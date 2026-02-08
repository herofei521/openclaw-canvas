import type { Node } from '@xyflow/react'

export interface TerminalNodeData {
  sessionId: string
  title: string
  width: number
  height: number
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
}

export interface PersistedAppState {
  activeWorkspaceId: string | null
  workspaces: PersistedWorkspaceState[]
}

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

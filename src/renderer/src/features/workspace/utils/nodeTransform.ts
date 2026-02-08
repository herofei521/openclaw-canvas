import type { Node } from '@xyflow/react'
import type { PersistedWorkspaceState, TerminalNodeData } from '../types'

export function toRuntimeNodes(workspace: PersistedWorkspaceState): Node<TerminalNodeData>[] {
  return workspace.nodes.map(node => ({
    id: node.id,
    type: 'terminalNode',
    position: node.position,
    data: {
      sessionId: '',
      title: node.title,
      width: node.width,
      height: node.height,
      kind: node.kind,
      status: node.status,
      startedAt: node.startedAt,
      endedAt: node.endedAt,
      exitCode: node.exitCode,
      lastError: node.lastError,
      agent: node.agent,
    },
    draggable: true,
    selectable: true,
  }))
}

/**
 * 架构视图模式模块导出
 *
 * @packageDocumentation
 */

// 类型导出
export type {
  CanvasViewMode,
  ArchitectureViewConfig,
  ArchitectureViewState,
  ArchitectureAgentNode,
  CollaborationLink,
  CollaborationType,
  AgentProviderInfo,
} from './types'

export {
  DEFAULT_ARCHITECTURE_VIEW_CONFIG,
  AGENT_PROVIDERS,
  getAgentStatusColor,
  getAgentStatusLabel,
  getCollaborationColor,
  getCollaborationLabel,
  getCollaborationStrokeStyle,
} from './types'

// Hook 导出
export { useArchitectureViewMode } from './useArchitectureViewMode'

// 组件导出
export { ArchitectureNode, ArchitectureNodeList } from './ArchitectureNode'
export { CollaborationEdge, CollaborationEdges } from './CollaborationEdge'
export { ArchitectureView } from './ArchitectureView'

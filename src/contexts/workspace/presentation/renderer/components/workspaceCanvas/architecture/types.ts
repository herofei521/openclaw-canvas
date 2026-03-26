/**
 * 架构视图模式类型定义
 * 
 * 本文件定义架构视图模式 (Architecture View Mode) 使用的类型。
 * 架构视图用于可视化 Agent 之间的协作关系和系统架构。
 * 
 * @packageDocumentation
 */

import type { AgentProviderId, AgentRuntimeStatus } from '@contexts/agent/infrastructure/openclaw-api/AgentApiTypes'
import type { Point } from '../../types'
import type { LabelColor } from '@shared/types/labelColor'

/**
 * 画布视图模式
 * 
 * 定义当前画布的显示模式。
 */
export type CanvasViewMode = 'default' | 'architecture'

/**
 * 架构视图配置
 * 
 * 配置架构视图的显示选项。
 */
export interface ArchitectureViewConfig {
  /** 是否显示 Agent 关系连线 */
  showAgentRelations: boolean
  /** 是否显示 Space 边界 */
  showSpaceBoundaries: boolean
  /** 是否高亮活跃 Agent */
  highlightActiveAgents: boolean
  /** 已折叠的 Space ID 列表 */
  collapsedSpaces: string[]
  /** 是否显示 Agent 状态指示器 */
  showStatusIndicators: boolean
  /** 是否显示 Agent 详细信息 */
  showAgentDetails: boolean
}

/**
 * 默认架构视图配置
 */
export const DEFAULT_ARCHITECTURE_VIEW_CONFIG: ArchitectureViewConfig = {
  showAgentRelations: true,
  showSpaceBoundaries: true,
  highlightActiveAgents: true,
  collapsedSpaces: [],
  showStatusIndicators: true,
  showAgentDetails: false,
}

/**
 * Agent 提供者类型
 * 
 * 与 AgentApiTypes 中的 AgentProviderId 保持一致，但添加显示名称。
 */
export interface AgentProviderInfo {
  /** 提供者 ID */
  id: AgentProviderId
  /** 显示名称 */
  displayName: string
  /** 图标名称 (用于 UI 渲染) */
  iconName: string
  /** 描述 */
  description: string
}

/**
 * 支持的 Agent 提供者列表
 */
export const AGENT_PROVIDERS: Record<AgentProviderId, AgentProviderInfo> = {
  'claude-code': {
    id: 'claude-code',
    displayName: 'Claude Code',
    iconName: 'claude',
    description: 'Anthropic 的代码助手',
  },
  codex: {
    id: 'codex',
    displayName: 'Codex',
    iconName: 'codex',
    description: 'OpenAI 的代码模型',
  },
  opencode: {
    id: 'opencode',
    displayName: 'OpenCode',
    iconName: 'opencode',
    description: '开源代码助手',
  },
  gemini: {
    id: 'gemini',
    displayName: 'Gemini',
    iconName: 'gemini',
    description: 'Google 的多模态模型',
  },
  openclaw: {
    id: 'openclaw',
    displayName: 'OpenClaw',
    iconName: 'openclaw',
    description: 'OpenClaw 原生 Agent',
  },
}

/**
 * 协作关系类型
 * 
 * 定义 Agent 之间的协作关系类型。
 */
export type CollaborationType = 
  | 'upstream'      // 上游 (接收任务)
  | 'downstream'    // 下游 (发送任务)
  | 'peer'          // 平级 (协作)
  | 'supervisor'    // 监督 (审核/审查)
  | 'auditor'       // 审计 (安全检查)

/**
 * Agent 协作关系
 * 
 * 表示两个 Agent 之间的协作关系。
 */
export interface CollaborationLink {
  /** 源 Agent ID */
  fromAgentId: string
  /** 目标 Agent ID */
  toAgentId: string
  /** 关系类型 */
  type: CollaborationType
  /** 关系强度 (0-1，用于连线粗细) */
  strength: number
  /** 最后交互时间 */
  lastInteraction?: string
  /** 关系描述 */
  description?: string
}

/**
 * Agent 节点数据
 * 
 * 架构视图中 Agent 节点的数据结构。
 */
export interface ArchitectureAgentNode {
  /** Agent 唯一标识符 */
  id: string
  /** Agent 名称 */
  name: string
  /** Agent 描述 */
  description: string
  /** Agent 提供者 */
  provider: AgentProviderId
  /** 当前运行状态 */
  status: AgentRuntimeStatus
  /** 节点位置 */
  position: Point
  /** 节点尺寸 */
  width: number
  /** 节点高度 */
  height: number
  /** 标签颜色 */
  labelColor: LabelColor | null
  /** 所属 Space ID */
  spaceId?: string
  /** 协作关系列表 */
  collaborations: CollaborationLink[]
  /** 是否被选中 */
  isSelected: boolean
  /** 是否被高亮 */
  isHighlighted: boolean
  /** 最后活动时间 */
  lastActivityAt?: string
  /** 支持的模型列表 */
  models: string[]
}

/**
 * 架构视图状态
 * 
 * 架构视图的完整状态。
 */
export interface ArchitectureViewState {
  /** 当前视图模式 */
  viewMode: CanvasViewMode
  /** 架构视图配置 */
  config: ArchitectureViewConfig
  /** Agent 节点列表 */
  agentNodes: ArchitectureAgentNode[]
  /** 所有协作关系 */
  allCollaborations: CollaborationLink[]
  /** 选中的 Agent ID 列表 */
  selectedAgentIds: string[]
  /** 悬停的 Agent ID */
  hoveredAgentId: string | null
  /** 视图缩放级别 */
  zoomLevel: number
  /** 视图中心点 */
  centerPoint: Point | null
}

/**
 * Agent 状态颜色映射
 * 
 * 根据 Agent 状态返回对应的颜色。
 */
export function getAgentStatusColor(status: AgentRuntimeStatus): string {
  switch (status) {
    case 'running':
      return '#22c55e' // green-500
    case 'standby':
      return '#eab308' // yellow-500
    case 'exited':
      return '#6b7280' // gray-500
    case 'failed':
      return '#ef4444' // red-500
    case 'stopped':
      return '#9ca3af' // gray-400
    case 'restoring':
      return '#3b82f6' // blue-500
    case 'initializing':
      return '#8b5cf6' // violet-500
    default:
      return '#6b7280' // gray-500
  }
}

/**
 * Agent 状态文本标签
 * 
 * 根据 Agent 状态返回对应的中文标签。
 */
export function getAgentStatusLabel(status: AgentRuntimeStatus): string {
  switch (status) {
    case 'running':
      return '运行中'
    case 'standby':
      return '待机'
    case 'exited':
      return '已退出'
    case 'failed':
      return '失败'
    case 'stopped':
      return '已停止'
    case 'restoring':
      return '恢复中'
    case 'initializing':
      return '初始化中'
    default:
      return '未知'
  }
}

/**
 * 协作关系颜色映射
 * 
 * 根据关系类型返回对应的颜色。
 */
export function getCollaborationColor(type: CollaborationType): string {
  switch (type) {
    case 'upstream':
      return '#3b82f6' // blue-500
    case 'downstream':
      return '#10b981' // emerald-500
    case 'peer':
      return '#8b5cf6' // violet-500
    case 'supervisor':
      return '#f59e0b' // amber-500
    case 'auditor':
      return '#ef4444' // red-500
    default:
      return '#6b7280' // gray-500
  }
}

/**
 * 协作关系文本标签
 * 
 * 根据关系类型返回对应的中文标签。
 */
export function getCollaborationLabel(type: CollaborationType): string {
  switch (type) {
    case 'upstream':
      return '上游'
    case 'downstream':
      return '下游'
    case 'peer':
      return '协作'
    case 'supervisor':
      return '监督'
    case 'auditor':
      return '审计'
    default:
      return '未知'
  }
}

/**
 * 协作关系连线样式
 * 
 * 根据关系类型返回连线样式配置。
 */
export function getCollaborationStrokeStyle(type: CollaborationType): {
  strokeDasharray: string
  strokeWidth: number
} {
  switch (type) {
    case 'upstream':
      return { strokeDasharray: '0', strokeWidth: 2 }
    case 'downstream':
      return { strokeDasharray: '0', strokeWidth: 2 }
    case 'peer':
      return { strokeDasharray: '5,5', strokeWidth: 2 }
    case 'supervisor':
      return { strokeDasharray: '2,2', strokeWidth: 3 }
    case 'auditor':
      return { strokeDasharray: '1,4', strokeWidth: 2 }
    default:
      return { strokeDasharray: '0', strokeWidth: 1 }
  }
}

/**
 * 架构节点组件
 * 
 * 在架构视图中显示 Agent 节点。
 * 
 * @packageDocumentation
 */

import React, { useCallback, useMemo } from 'react'
import type { ArchitectureAgentNode, CollaborationType } from './types'
import {
  getAgentStatusColor,
  getAgentStatusLabel,
  AGENT_PROVIDERS,
  getCollaborationColor,
  getCollaborationLabel,
} from './types'

/**
 * 架构节点组件属性
 */
export interface ArchitectureNodeProps {
  /** Agent 节点数据 */
  node: ArchitectureAgentNode
  /** 是否显示详细信息 */
  showDetails: boolean
  /** 是否高亮活跃 Agent */
  highlightActive: boolean
  /** 节点点击处理函数 */
  onClick?: (nodeId: string, event: React.MouseEvent) => void
  /** 节点悬停进入处理函数 */
  onMouseEnter?: (nodeId: string) => void
  /** 节点悬停离开处理函数 */
  onMouseLeave?: (nodeId: string) => void
  /** 节点双击处理函数 */
  onDoubleClick?: (nodeId: string, event: React.MouseEvent) => void
}

/**
 * 架构节点组件
 * 
 * 渲染单个 Agent 节点的可视化表示。
 */
export function ArchitectureNode({
  node,
  showDetails,
  highlightActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
}: ArchitectureNodeProps): React.JSX.Element {
  const providerInfo = AGENT_PROVIDERS[node.provider]
  const statusColor = getAgentStatusColor(node.status)
  const statusLabel = getAgentStatusLabel(node.status)
  
  const isActive = node.status === 'running' || node.status === 'standby'
  const shouldHighlight = highlightActive && isActive

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      onClick?.(node.id, event)
    },
    [node.id, onClick]
  )

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.(node.id)
  }, [node.id, onMouseEnter])

  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.()
  }, [onMouseLeave])

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      onDoubleClick?.(node.id, event)
    },
    [node.id, onDoubleClick]
  )

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      position: 'absolute',
      left: node.position.x,
      top: node.position.y,
      width: node.width,
      height: node.height,
      backgroundColor: node.isSelected ? '#3b82f6' : shouldHighlight ? '#1e3a5f' : '#1f2937',
      border: node.isSelected 
        ? '2px solid #60a5fa' 
        : node.isHighlighted 
          ? '2px solid #fbbf24'
          : '1px solid #374151',
      borderRadius: '8px',
      padding: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: node.isSelected 
        ? '0 0 20px rgba(59, 130, 246, 0.5)' 
        : shouldHighlight
          ? '0 0 15px rgba(34, 197, 94, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
      zIndex: node.isSelected ? 100 : node.isHighlighted ? 50 : 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      overflow: 'hidden',
    }),
    [
      node.position.x,
      node.position.y,
      node.width,
      node.height,
      node.isSelected,
      node.isHighlighted,
      shouldHighlight,
    ]
  )

  const headerStyle: React.CSSProperties = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px',
    }),
    []
  )

  const statusIndicatorStyle: React.CSSProperties = useMemo(
    () => ({
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: statusColor,
      boxShadow: `0 0 8px ${statusColor}`,
      flexShrink: 0,
    }),
    [statusColor]
  )

  const nameStyle: React.CSSProperties = useMemo(
    () => ({
      fontSize: '14px',
      fontWeight: '600',
      color: '#f9fafb',
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    []
  )

  const providerBadgeStyle: React.CSSProperties = useMemo(
    () => ({
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: '#374151',
      color: '#9ca3af',
      flexShrink: 0,
    }),
    []
  )

  const descriptionStyle: React.CSSProperties = useMemo(
    () => ({
      fontSize: '11px',
      color: '#9ca3af',
      lineHeight: '1.4',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: showDetails ? 3 : 1,
      WebkitBoxOrient: 'vertical',
    }),
    [showDetails]
  )

  const statusBadgeStyle: React.CSSProperties = useMemo(
    () => ({
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: `${statusColor}20`,
      color: statusColor,
      border: `1px solid ${statusColor}40`,
      alignSelf: 'flex-start',
    }),
    [statusColor]
  )

  const collaborationsContainerStyle: React.CSSProperties = useMemo(
    () => ({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: '4px',
    }),
    []
  )

  const collaborationBadgeStyle = (type: CollaborationType): React.CSSProperties => ({
    fontSize: '9px',
    padding: '1px 4px',
    borderRadius: '3px',
    backgroundColor: `${getCollaborationColor(type)}20`,
    color: getCollaborationColor(type),
    border: `1px solid ${getCollaborationColor(type)}40`,
  })

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={`Agent: ${node.name}, Status: ${statusLabel}`}
    >
      {/* Header */}
      <div style={headerStyle}>
        <div style={statusIndicatorStyle} title={statusLabel} />
        <span style={nameStyle} title={node.name}>
          {node.name}
        </span>
        <span style={providerBadgeStyle} title={providerInfo?.displayName}>
          {providerInfo?.displayName || node.provider}
        </span>
      </div>

      {/* Description */}
      <div style={descriptionStyle} title={node.description}>
        {node.description || '暂无描述'}
      </div>

      {/* Status Badge */}
      <div style={statusBadgeStyle}>
        {statusLabel}
      </div>

      {/* Collaborations (if showing details) */}
      {showDetails && node.collaborations.length > 0 && (
        <div style={collaborationsContainerStyle}>
          {node.collaborations.slice(0, 5).map((collab, index) => (
            <span 
              key={`${collab.toAgentId}-${index}`} 
              style={collaborationBadgeStyle(collab.type)}
              title={`${getCollaborationLabel(collab.type)}: ${collab.toAgentId}`}
            >
              {getCollaborationLabel(collab.type)}
            </span>
          ))}
          {node.collaborations.length > 5 && (
            <span style={{ fontSize: '9px', color: '#6b7280' }}>
              +{node.collaborations.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Last Activity (if showing details) */}
      {showDetails && node.lastActivityAt && (
        <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>
          最后活动：{new Date(node.lastActivityAt).toLocaleString('zh-CN')}
        </div>
      )}
    </div>
  )
}

/**
 * 架构节点列表组件
 * 
 * 渲染所有 Agent 节点。
 */
export interface ArchitectureNodeListProps {
  /** Agent 节点列表 */
  nodes: ArchitectureAgentNode[]
  /** 是否显示详细信息 */
  showDetails: boolean
  /** 是否高亮活跃 Agent */
  highlightActive: boolean
  /** 节点点击处理函数 */
  onNodeClick?: (nodeId: string, event: React.MouseEvent) => void
  /** 节点悬停进入处理函数 */
  onNodeHover?: (nodeId: string) => void
  /** 节点悬停离开处理函数 */
  onNodeHoverEnd?: () => void
  /** 节点双击处理函数 */
  onNodeDoubleClick?: (nodeId: string, event: React.MouseEvent) => void
}

/**
 * 架构节点列表组件
 */
export function ArchitectureNodeList({
  nodes,
  showDetails,
  highlightActive,
  onNodeClick,
  onNodeHover,
  onNodeHoverEnd,
  onNodeDoubleClick,
}: ArchitectureNodeListProps): React.JSX.Element {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {nodes.map(node => (
        <ArchitectureNode
          key={node.id}
          node={node}
          showDetails={showDetails}
          highlightActive={highlightActive}
          onClick={onNodeClick}
          onMouseEnter={onNodeHover}
          onMouseLeave={onNodeHoverEnd}
          onDoubleClick={onNodeDoubleClick}
        />
      ))}
    </div>
  )
}

export default ArchitectureNode

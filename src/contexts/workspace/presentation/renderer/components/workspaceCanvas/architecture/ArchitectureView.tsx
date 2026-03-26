/**
 * 架构视图主组件
 *
 * 整合架构视图的所有子组件，提供完整的架构可视化界面。
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react'
import type { ArchitectureAgentNode, CollaborationLink, ArchitectureViewConfig } from './types'
import { ArchitectureNodeList } from './ArchitectureNode'
import { CollaborationEdges } from './CollaborationEdge'
import { useArchitectureViewMode } from './useArchitectureViewMode'

/**
 * 架构视图组件属性
 */
export interface ArchitectureViewProps {
  /** Agent 节点列表 */
  nodes: ArchitectureAgentNode[]
  /** 协作关系列表 */
  collaborations: CollaborationLink[]
  /** 初始配置 */
  initialConfig?: Partial<ArchitectureViewConfig>
  /** 视图模式变化回调 */
  onViewModeChange?: (viewMode: 'default' | 'architecture') => void
  /** 节点选择变化回调 */
  onSelectionChange?: (selectedIds: string[]) => void
  /** 配置变化回调 */
  onConfigChange?: (config: ArchitectureViewConfig) => void
}

/**
 * 架构视图主组件
 *
 * 提供完整的架构可视化界面，包括：
 * - Agent 节点显示
 * - 协作关系连线
 * - 视图控制工具栏
 * - 状态指示器
 */
export function ArchitectureView({
  nodes,
  collaborations,
  initialConfig,
  onViewModeChange,
  onSelectionChange,
  onConfigChange,
}: ArchitectureViewProps): React.JSX.Element {
  const {
    viewMode,
    architectureState,
    switchToDefault,
    switchToArchitecture,
    toggleViewMode,
    updateConfig,
    resetConfig,
    selectAgent,
    clearSelection,
    setHoveredAgent,
  } = useArchitectureViewMode('architecture')

  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null)

  // 合并初始配置
  const config: ArchitectureViewConfig = useMemo(
    () => ({
      ...architectureState.config,
      ...initialConfig,
    }),
    [architectureState.config, initialConfig],
  )

  // 通知父组件视图模式变化
  React.useEffect(() => {
    onViewModeChange?.(viewMode)
  }, [viewMode, onViewModeChange])

  // 通知父组件选中变化
  React.useEffect(() => {
    onSelectionChange?.(architectureState.selectedAgentIds)
  }, [architectureState.selectedAgentIds, onSelectionChange])

  // 通知父组件配置变化
  React.useEffect(() => {
    onConfigChange?.(config)
  }, [config, onConfigChange])

  /**
   * 处理节点点击
   */
  const handleNodeClick = useCallback(
    (nodeId: string, event: React.MouseEvent) => {
      const multi = event.shiftKey || event.ctrlKey || event.metaKey
      selectAgent(nodeId, multi)
    },
    [selectAgent],
  )

  /**
   * 处理节点悬停
   */
  const handleNodeHover = useCallback(
    (nodeId: string) => {
      setHoveredAgent(nodeId)
    },
    [setHoveredAgent],
  )

  /**
   * 处理节点悬停结束
   */
  const handleNodeHoverEnd = useCallback(() => {
    setHoveredAgent(null)
  }, [setHoveredAgent])

  /**
   * 处理连线悬停
   */
  const handleLinkHover = useCallback((link: CollaborationLink) => {
    setHoveredLinkId(`${link.fromAgentId}-${link.toAgentId}`)
  }, [])

  /**
   * 处理连线悬停结束
   */
  const handleLinkHoverEnd = useCallback(() => {
    setHoveredLinkId(null)
  }, [])

  /**
   * 处理背景点击 (清空选中)
   */
  const handleBackgroundClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        clearSelection()
      }
    },
    [clearSelection],
  )

  /**
   * 获取高亮的连线 ID 列表
   */
  const highlightedLinkIds = useMemo(() => {
    if (!hoveredLinkId) return []
    return architectureState.selectedAgentIds.flatMap(selectedId =>
      collaborations
        .filter(link => link.fromAgentId === selectedId || link.toAgentId === selectedId)
        .map((link, index) => `${link.fromAgentId}-${link.toAgentId}-${index}`),
    )
  }, [architectureState.selectedAgentIds, collaborations, hoveredLinkId])

  // 容器样式
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    overflow: 'auto',
    cursor: 'default',
  }

  // 工具栏样式
  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    display: 'flex',
    gap: '8px',
    zIndex: 1000,
    backgroundColor: '#1e293b',
    padding: '8px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  }

  // 按钮样式
  const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#e2e8f0',
    backgroundColor: '#334155',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  }

  // 统计信息样式
  const statsStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    display: 'flex',
    gap: '16px',
    zIndex: 1000,
    backgroundColor: '#1e293b',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  }

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const statValueStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f1f5f9',
  }

  return (
    <div style={containerStyle} onClick={handleBackgroundClick} data-testid="architecture-view">
      {/* 工具栏 */}
      <div style={toolbarStyle}>
        <button
          data-testid="default-view-button"
          style={viewMode === 'default' ? activeButtonStyle : buttonStyle}
          onClick={switchToDefault}
          title="切换到默认视图"
        >
          默认视图
        </button>
        <button
          data-testid="architecture-view-button"
          style={viewMode === 'architecture' ? activeButtonStyle : buttonStyle}
          onClick={switchToArchitecture}
          title="切换到架构视图"
        >
          架构视图
        </button>
        <button
          data-testid="view-mode-toggle"
          style={buttonStyle}
          onClick={toggleViewMode}
          title="切换视图模式"
        >
          切换视图
        </button>
        <button
          style={buttonStyle}
          onClick={() => updateConfig({ showAgentDetails: !config.showAgentDetails })}
          title="切换详细信息"
        >
          {config.showAgentDetails ? '隐藏详情' : '显示详情'}
        </button>
        <button
          style={buttonStyle}
          onClick={() => updateConfig({ showAgentRelations: !config.showAgentRelations })}
          title="切换关系连线"
        >
          {config.showAgentRelations ? '隐藏连线' : '显示连线'}
        </button>
        <button style={buttonStyle} onClick={resetConfig} title="重置配置">
          重置
        </button>
      </div>

      {/* 统计信息 */}
      <div style={statsStyle}>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Agent 数量</span>
          <span style={statValueStyle}>{nodes.length}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>协作关系</span>
          <span style={statValueStyle}>{collaborations.length}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>已选中</span>
          <span style={{ ...statValueStyle, color: '#3b82f6' }}>
            {architectureState.selectedAgentIds.length}
          </span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>运行中</span>
          <span style={{ ...statValueStyle, color: '#22c55e' }}>
            {nodes.filter(n => n.status === 'running').length}
          </span>
        </div>
      </div>

      {/* 协作关系连线层 */}
      {config.showAgentRelations && (
        <CollaborationEdges
          nodes={nodes}
          collaborations={collaborations}
          highlightedLinkIds={highlightedLinkIds}
          hoveredLinkId={hoveredLinkId}
          onLinkHover={handleLinkHover}
          onLinkHoverEnd={handleLinkHoverEnd}
        />
      )}

      {/* Agent 节点层 */}
      <ArchitectureNodeList
        nodes={nodes}
        showDetails={config.showAgentDetails}
        highlightActive={config.highlightActiveAgents}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeHoverEnd={handleNodeHoverEnd}
        onNodeDoubleClick={_nodeId => {
          // 双击显示/隐藏详情
          updateConfig({ showAgentDetails: !config.showAgentDetails })
        }}
      />
    </div>
  )
}

export default ArchitectureView

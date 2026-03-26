/**
 * 架构视图模式 Hook
 * 
 * 提供视图模式切换和状态管理的逻辑。
 * 
 * @packageDocumentation
 */

import { useCallback, useMemo, useState } from 'react'
import type {
  CanvasViewMode,
  ArchitectureViewConfig,
  ArchitectureViewState,
  ArchitectureAgentNode,
  CollaborationLink,
} from './types'
import { DEFAULT_ARCHITECTURE_VIEW_CONFIG } from './types'
import type { Point } from '../../types'

/**
 * 使用架构视图模式
 * 
 * 管理画布视图模式的切换和架构视图状态。
 * 
 * @param initialMode - 初始视图模式
 * @returns 视图模式状态和操作函数
 */
export function useArchitectureViewMode(
  initialMode: CanvasViewMode = 'default'
): {
  /** 当前视图模式 */
  viewMode: CanvasViewMode
  /** 架构视图状态 */
  architectureState: ArchitectureViewState
  /** 切换到默认视图 */
  switchToDefault: () => void
  /** 切换到架构视图 */
  switchToArchitecture: () => void
  /** 切换视图模式 */
  toggleViewMode: () => void
  /** 更新架构视图配置 */
  updateConfig: (config: Partial<ArchitectureViewConfig>) => void
  /** 重置配置为默认值 */
  resetConfig: () => void
  /** 选中 Agent */
  selectAgent: (agentId: string, multi?: boolean) => void
  /** 取消选中 Agent */
  deselectAgent: (agentId: string) => void
  /** 清空选中 */
  clearSelection: () => void
  /** 设置悬停 Agent */
  setHoveredAgent: (agentId: string | null) => void
  /** 更新视图中心点 */
  setCenterPoint: (point: Point | null) => void
  /** 更新缩放级别 */
  setZoomLevel: (zoom: number) => void
  /** 折叠/展开 Space */
  toggleSpaceCollapse: (spaceId: string) => void
} {
  const [viewMode, setViewMode] = useState<CanvasViewMode>(initialMode)
  const [config, setConfig] = useState<ArchitectureViewConfig>(DEFAULT_ARCHITECTURE_VIEW_CONFIG)
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null)
  const [centerPoint, setCenterPoint] = useState<Point | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  // 示例 Agent 节点数据 (实际应从 API 获取)
  const agentNodes: ArchitectureAgentNode[] = useMemo(() => [], [])
  
  // 示例协作关系数据 (实际应从 API 获取)
  const allCollaborations: CollaborationLink[] = useMemo(() => [], [])

  const architectureState: ArchitectureViewState = useMemo(
    () => ({
      viewMode,
      config,
      agentNodes,
      allCollaborations,
      selectedAgentIds,
      hoveredAgentId,
      zoomLevel,
      centerPoint,
    }),
    [
      viewMode,
      config,
      agentNodes,
      allCollaborations,
      selectedAgentIds,
      hoveredAgentId,
      zoomLevel,
      centerPoint,
    ]
  )

  /**
   * 切换到默认视图
   */
  const switchToDefault = useCallback(() => {
    setViewMode('default')
  }, [])

  /**
   * 切换到架构视图
   */
  const switchToArchitecture = useCallback(() => {
    setViewMode('architecture')
  }, [])

  /**
   * 切换视图模式
   */
  const toggleViewMode = useCallback(() => {
    setViewMode(current => (current === 'default' ? 'architecture' : 'default'))
  }, [])

  /**
   * 更新架构视图配置
   */
  const updateConfig = useCallback((newConfig: Partial<ArchitectureViewConfig>) => {
    setConfig(current => ({ ...current, ...newConfig }))
  }, [])

  /**
   * 重置配置为默认值
   */
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_ARCHITECTURE_VIEW_CONFIG)
  }, [])

  /**
   * 选中 Agent
   */
  const selectAgent = useCallback((agentId: string, multi: boolean = false) => {
    setSelectedAgentIds(current => {
      if (multi) {
        if (current.includes(agentId)) {
          return current.filter(id => id !== agentId)
        }
        return [...current, agentId]
      }
      return [agentId]
    })
  }, [])

  /**
   * 取消选中 Agent
   */
  const deselectAgent = useCallback((agentId: string) => {
    setSelectedAgentIds(current => current.filter(id => id !== agentId))
  }, [])

  /**
   * 清空选中
   */
  const clearSelection = useCallback(() => {
    setSelectedAgentIds([])
  }, [])

  /**
   * 设置悬停 Agent
   */
  const setHoveredAgent = useCallback((agentId: string | null) => {
    setHoveredAgentId(agentId)
  }, [])

  /**
   * 更新视图中心点
   */
  const updateCenterPoint = useCallback((point: Point | null) => {
    setCenterPoint(point)
  }, [])

  /**
   * 更新缩放级别
   */
  const updateZoomLevel = useCallback((zoom: number) => {
    setZoomLevel(Math.max(0.1, Math.min(5, zoom)))
  }, [])

  /**
   * 折叠/展开 Space
   */
  const toggleSpaceCollapse = useCallback((spaceId: string) => {
    setConfig(current => ({
      ...current,
      collapsedSpaces: current.collapsedSpaces.includes(spaceId)
        ? current.collapsedSpaces.filter(id => id !== spaceId)
        : [...current.collapsedSpaces, spaceId],
    }))
  }, [])

  return {
    viewMode,
    architectureState,
    switchToDefault,
    switchToArchitecture,
    toggleViewMode,
    updateConfig,
    resetConfig,
    selectAgent,
    deselectAgent,
    clearSelection,
    setHoveredAgent,
    setCenterPoint: updateCenterPoint,
    setZoomLevel: updateZoomLevel,
    toggleSpaceCollapse,
  }
}

/**
 * 导出类型供外部使用
 */
export type { CanvasViewMode, ArchitectureViewConfig, ArchitectureViewState }

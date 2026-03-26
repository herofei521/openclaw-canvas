/**
 * 架构视图容器组件
 *
 * 整合架构视图组件和数据 Hook，提供完整的架构视图功能。
 *
 * @packageDocumentation
 */

import React from 'react'
import { ArchitectureView } from './architecture/ArchitectureView'
import {
  useArchitectureViewData,
  useArchitectureViewDataMock,
} from './hooks/useArchitectureViewData'
import type { OpenClawApiClient } from '@contexts/agent/infrastructure/openclaw-api/OpenClawApiClient'
import type { ArchitectureViewConfig } from '../architecture/types'

/**
 * 架构视图容器组件属性
 */
export interface ArchitectureViewContainerProps {
  /** Agent API 客户端实例 (可选，不提供则使用模拟数据) */
  apiClient?: OpenClawApiClient
  /** 是否使用模拟数据 (默认 false) */
  useMockData?: boolean
  /** 自动刷新间隔 (毫秒，默认 30000) */
  refreshInterval?: number
  /** 初始配置 */
  initialConfig?: Partial<ArchitectureViewConfig>
  /** 视图模式变化回调 */
  onViewModeChange?: (viewMode: 'default' | 'architecture') => void
  /** 节点选择变化回调 */
  onSelectionChange?: (selectedIds: string[]) => void
  /** 配置变化回调 */
  onConfigChange?: (config: ArchitectureViewConfig) => void
  /** 加载状态渲染器 (可选) */
  loadingRenderer?: () => React.ReactNode
  /** 错误状态渲染器 (可选) */
  errorRenderer?: (error: Error, retry: () => void) => React.ReactNode
}

/**
 * 加载状态组件
 */
function LoadingState(): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #334155',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <div style={{ fontSize: '14px', color: '#94a3b8' }}>加载 Agent 数据...</div>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

/**
 * 错误状态组件
 */
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        gap: '16px',
        padding: '24px',
      }}
    >
      <div style={{ fontSize: '48px' }}>⚠️</div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>加载失败</div>
      <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', maxWidth: '400px' }}>
        {error.message}
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#ffffff',
          backgroundColor: '#3b82f6',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        重试
      </button>
    </div>
  )
}

/**
 * 架构视图容器组件
 *
 * 提供完整的架构视图功能，包括：
 * - 数据获取和状态管理
 * - 加载和错误状态处理
 * - 视图组件渲染
 */
export function ArchitectureViewContainer({
  apiClient,
  useMockData = false,
  refreshInterval = 30000,
  initialConfig,
  onViewModeChange,
  onSelectionChange,
  onConfigChange,
  loadingRenderer,
  errorRenderer,
}: ArchitectureViewContainerProps): React.JSX.Element {
  // 选择数据源
  const dataState = useMockData
    ? useArchitectureViewDataMock()
    : useArchitectureViewData(apiClient, true, refreshInterval)

  const { nodes, collaborations, isLoading, error, refresh } = dataState

  // 加载状态
  if (isLoading) {
    return loadingRenderer ? <>{loadingRenderer()}</> : <LoadingState />
  }

  // 错误状态
  if (error) {
    return errorRenderer ? (
      <>{errorRenderer(error, refresh)}</>
    ) : (
      <ErrorState error={error} onRetry={refresh} />
    )
  }

  // 渲染架构视图
  return (
    <ArchitectureView
      nodes={nodes}
      collaborations={collaborations}
      initialConfig={initialConfig}
      onViewModeChange={onViewModeChange}
      onSelectionChange={onSelectionChange}
      onConfigChange={onConfigChange}
    />
  )
}

export default ArchitectureViewContainer

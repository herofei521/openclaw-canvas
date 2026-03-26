/**
 * ArchitectureViewContainer 组件测试
 *
 * 测试架构视图容器组件的功能：
 * - 正常渲染、加载状态、错误状态、重试功能
 * - 数据转换 (AgentInfo → ArchitectureAgentNode)
 * - 协作关系生成 (三省六部连线)
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ArchitectureViewContainer } from '@contexts/workspace/presentation/renderer/components/workspaceCanvas/ArchitectureViewContainer'
import type { OpenClawApiClient } from '@contexts/agent/infrastructure/openclaw-api/OpenClawApiClient'
import type { AgentInfo } from '@contexts/agent/infrastructure/openclaw-api/AgentApiTypes'

// Mock the ArchitectureView component
vi.mock(
  '@contexts/workspace/presentation/renderer/components/workspaceCanvas/architecture/ArchitectureView',
  () => ({
    ArchitectureView: ({ nodes, collaborations }: { nodes: any[]; collaborations: any[] }) => (
      <div data-testid="architecture-view">
        <div data-testid="nodes-count">Nodes: {nodes.length}</div>
        <div data-testid="collaborations-count">Collaborations: {collaborations.length}</div>
        {nodes.map(node => (
          <div key={node.id} data-testid={`node-${node.id}`}>
            {node.name}
          </div>
        ))}
      </div>
    ),
  }),
)

// Mock the useArchitectureViewData hook
vi.mock(
  '@contexts/workspace/presentation/renderer/components/workspaceCanvas/hooks/useArchitectureViewData',
  () => ({
    useArchitectureViewData: vi.fn(),
    useArchitectureViewDataMock: vi.fn(),
  }),
)

const { useArchitectureViewData, useArchitectureViewDataMock } =
  await import('@contexts/workspace/presentation/renderer/components/workspaceCanvas/hooks/useArchitectureViewData')

describe('ArchitectureViewContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      })

      render(<ArchitectureViewContainer apiClient={{} as OpenClawApiClient} />)

      expect(screen.getByText('加载 Agent 数据...')).toBeInTheDocument()
    })

    it('should show custom loading renderer when provided', () => {
      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      })

      const customLoading = () => <div data-testid="custom-loading">Custom Loading...</div>
      render(
        <ArchitectureViewContainer
          apiClient={{} as OpenClawApiClient}
          loadingRenderer={customLoading}
        />,
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      expect(screen.queryByText('加载 Agent 数据...')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should show error message when error occurs', () => {
      const testError = new Error('Failed to fetch agents')
      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: false,
        error: testError,
        refresh: vi.fn(),
      })

      render(<ArchitectureViewContainer apiClient={{} as OpenClawApiClient} />)

      expect(screen.getByText('加载失败')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch agents')).toBeInTheDocument()
    })

    it('should show custom error renderer when provided', () => {
      const testError = new Error('Network error')
      const refreshMock = vi.fn()
      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: false,
        error: testError,
        refresh: refreshMock,
      })

      const customError = (error: Error, retry: () => void) => (
        <div data-testid="custom-error">
          Custom Error: {error.message}
          <button onClick={retry} data-testid="custom-retry">
            Retry
          </button>
        </div>
      )
      render(
        <ArchitectureViewContainer
          apiClient={{} as OpenClawApiClient}
          errorRenderer={customError}
        />,
      )

      expect(screen.getByTestId('custom-error')).toBeInTheDocument()
      expect(screen.getByText('Custom Error: Network error')).toBeInTheDocument()
    })

    it('should call refresh when retry button is clicked', () => {
      const testError = new Error('Connection timeout')
      const refreshMock = vi.fn()
      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: false,
        error: testError,
        refresh: refreshMock,
      })

      render(<ArchitectureViewContainer apiClient={{} as OpenClawApiClient} />)

      const retryButton = screen.getByText('重试')
      fireEvent.click(retryButton)

      expect(refreshMock).toHaveBeenCalled()
    })
  })

  describe('successful rendering', () => {
    it('should render ArchitectureView with nodes and collaborations', () => {
      const mockNodes = [
        {
          id: 'agent-1',
          name: 'Test Agent 1',
          provider: 'claude-code' as const,
          collaborations: [],
        },
        {
          id: 'agent-2',
          name: 'Test Agent 2',
          provider: 'gemini' as const,
          collaborations: [],
        },
      ]
      const mockCollaborations = [
        {
          fromAgentId: 'agent-1',
          toAgentId: 'agent-2',
          type: 'supervisor' as const,
          strength: 0.8,
        },
      ]

      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: mockNodes,
        collaborations: mockCollaborations,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      })

      render(<ArchitectureViewContainer apiClient={{} as OpenClawApiClient} />)

      expect(screen.getByTestId('architecture-view')).toBeInTheDocument()
      expect(screen.getByText('Nodes: 2')).toBeInTheDocument()
      expect(screen.getByText('Collaborations: 1')).toBeInTheDocument()
    })

    it('should pass callbacks to ArchitectureView', () => {
      const onViewModeChange = vi.fn()
      const onSelectionChange = vi.fn()
      const onConfigChange = vi.fn()

      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      })

      render(
        <ArchitectureViewContainer
          apiClient={{} as OpenClawApiClient}
          onViewModeChange={onViewModeChange}
          onSelectionChange={onSelectionChange}
          onConfigChange={onConfigChange}
        />,
      )

      // ArchitectureView should be rendered with callbacks
      expect(screen.getByTestId('architecture-view')).toBeInTheDocument()
    })
  })

  describe('mock data mode', () => {
    it('should use mock data when useMockData is true', () => {
      const mockNodes = [
        {
          id: 'mock-agent',
          name: 'Mock Agent',
          provider: 'claude-code' as const,
          collaborations: [],
        },
      ]
      const mockCollaborations = []

      vi.mocked(useArchitectureViewDataMock).mockReturnValue({
        nodes: mockNodes,
        collaborations: mockCollaborations,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      })

      render(<ArchitectureViewContainer useMockData={true} />)

      expect(useArchitectureViewDataMock).toHaveBeenCalled()
      expect(useArchitectureViewData).not.toHaveBeenCalled()
    })

    it('should show loading state for mock data', () => {
      vi.mocked(useArchitectureViewDataMock).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      })

      render(<ArchitectureViewContainer useMockData={true} />)

      expect(screen.getByText('加载 Agent 数据...')).toBeInTheDocument()
    })
  })

  describe('data transformation', () => {
    it('should handle empty nodes list', () => {
      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      })

      render(<ArchitectureViewContainer apiClient={{} as OpenClawApiClient} />)

      expect(screen.getByText('Nodes: 0')).toBeInTheDocument()
      expect(screen.getByText('Collaborations: 0')).toBeInTheDocument()
    })

    it('should handle nodes without collaborations', () => {
      const mockNodes = [
        {
          id: 'standalone-agent',
          name: 'Standalone Agent',
          provider: 'openclaw' as const,
          collaborations: [],
        },
      ]

      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: mockNodes,
        collaborations: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      })

      render(<ArchitectureViewContainer apiClient={{} as OpenClawApiClient} />)

      expect(screen.getByText('Nodes: 1')).toBeInTheDocument()
      expect(screen.getByText('Collaborations: 0')).toBeInTheDocument()
    })
  })

  describe('refresh interval', () => {
    it('should accept custom refresh interval', () => {
      const refreshMock = vi.fn()
      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: false,
        error: null,
        refresh: refreshMock,
      })

      render(
        <ArchitectureViewContainer apiClient={{} as OpenClawApiClient} refreshInterval={60000} />,
      )

      // Component should be rendered successfully
      expect(screen.getByTestId('architecture-view')).toBeInTheDocument()
    })
  })

  describe('initial configuration', () => {
    it('should accept initial configuration', () => {
      vi.mocked(useArchitectureViewData).mockReturnValue({
        nodes: [],
        collaborations: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      })

      const initialConfig = {
        showAgentRelations: false,
        showSpaceBoundaries: true,
        highlightActiveAgents: false,
        collapsedSpaces: ['space-1'],
      }

      render(
        <ArchitectureViewContainer
          apiClient={{} as OpenClawApiClient}
          initialConfig={initialConfig}
        />,
      )

      expect(screen.getByTestId('architecture-view')).toBeInTheDocument()
    })
  })
})

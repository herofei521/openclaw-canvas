/**
 * useArchitectureViewData Hook 测试
 *
 * 测试架构视图数据 Hook 的功能：
 * - 数据获取和状态管理
 * - 数据转换 (AgentInfo → ArchitectureAgentNode)
 * - 协作关系生成 (三省六部连线)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import {
  useArchitectureViewData,
  useArchitectureViewDataMock,
} from '@contexts/workspace/presentation/renderer/components/workspaceCanvas/hooks/useArchitectureViewData'
import type { OpenClawApiClient } from '@contexts/agent/infrastructure/openclaw-api/OpenClawApiClient'
import type { AgentInfo } from '@contexts/agent/infrastructure/openclaw-api/AgentApiTypes'

describe('useArchitectureViewData', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should start with loading state', async () => {
      const mockApiClient = {
        listAgents: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 100 }),
      } as unknown as OpenClawApiClient

      const { result } = renderHook(() => useArchitectureViewData(mockApiClient, false))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.nodes).toEqual([])
      expect(result.current.collaborations).toEqual([])

      // Wait for data to be fetched
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle missing API client gracefully', () => {
      const { result } = renderHook(() => useArchitectureViewData(undefined, false))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.nodes).toEqual([])
      expect(result.current.collaborations).toEqual([])
      expect(result.current.error).toBe(null)
    })
  })

  describe('data fetching', () => {
    it('should fetch agents and transform to nodes', async () => {
      const mockAgents: AgentInfo[] = [
        {
          id: 'agent-1',
          name: 'Test Agent 1',
          description: 'Test Description 1',
          provider: 'claude-code',
          status: 'running',
          models: [{ id: 'model-1', displayName: 'Model 1', description: 'Desc', isDefault: true }],
          createdAt: '2026-03-20T00:00:00Z',
          updatedAt: '2026-03-26T15:00:00Z',
        },
      ]

      const mockApiClient = {
        listAgents: vi
          .fn()
          .mockResolvedValue({ items: mockAgents, total: 1, page: 1, pageSize: 100 }),
      } as unknown as OpenClawApiClient

      const { result } = renderHook(() => useArchitectureViewData(mockApiClient, false))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.nodes).toHaveLength(1)
      expect(result.current.nodes[0].id).toBe('agent-1')
      expect(result.current.nodes[0].name).toBe('Test Agent 1')
    })

    it('should handle API error gracefully', async () => {
      const mockApiClient = {
        listAgents: vi.fn().mockRejectedValue(new Error('Network error')),
      } as unknown as OpenClawApiClient

      const { result } = renderHook(() => useArchitectureViewData(mockApiClient, false))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.nodes).toEqual([])
    })
  })

  describe('data transformation', () => {
    it('should map AgentInfo to ArchitectureAgentNode correctly', async () => {
      const mockAgent: AgentInfo = {
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test Description',
        provider: 'openclaw',
        status: 'running',
        models: [
          {
            id: 'minimax-m2.7',
            displayName: 'MiniMax M2.7',
            description: 'MiniMax',
            isDefault: true,
          },
        ],
        createdAt: '2026-03-22T00:00:00Z',
        updatedAt: '2026-03-26T15:30:00Z',
      }

      const mockApiClient = {
        listAgents: vi
          .fn()
          .mockResolvedValue({ items: [mockAgent], total: 1, page: 1, pageSize: 100 }),
      } as unknown as OpenClawApiClient

      const { result } = renderHook(() => useArchitectureViewData(mockApiClient, false))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const node = result.current.nodes[0]
      expect(node.id).toBe('test-agent')
      expect(node.name).toBe('Test Agent')
      expect(node.provider).toBe('openclaw')
      expect(node.status).toBe('running')
      expect(node.position).toBeDefined()
      expect(node.width).toBe(280)
      expect(node.height).toBe(120)
      expect(node.models).toEqual(['minimax-m2.7'])
    })

    it('should generate deterministic positions for same agent', async () => {
      const mockAgent: AgentInfo = {
        id: 'fixed-agent-id',
        name: 'Fixed Agent',
        description: 'Fixed',
        provider: 'claude-code',
        status: 'running',
        models: [],
        createdAt: '2026-03-20T00:00:00Z',
        updatedAt: '2026-03-26T15:00:00Z',
      }

      const mockApiClient = {
        listAgents: vi
          .fn()
          .mockResolvedValue({ items: [mockAgent], total: 1, page: 1, pageSize: 100 }),
      } as unknown as OpenClawApiClient

      const { result: result1 } = renderHook(() => useArchitectureViewData(mockApiClient, false))
      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })
      const position1 = result1.current.nodes[0].position

      const { result: result2 } = renderHook(() => useArchitectureViewData(mockApiClient, false))
      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })
      const position2 = result2.current.nodes[0].position

      expect(position1).toEqual(position2)
    })
  })

  describe('collaboration generation', () => {
    it('should generate collaborations between 三省六部 agents', async () => {
      const mockAgents: AgentInfo[] = [
        {
          id: 'zhongshu-1',
          name: '中书省',
          description: '架构设计',
          provider: 'claude-code',
          status: 'running',
          models: [],
          createdAt: '2026-03-20T00:00:00Z',
          updatedAt: '2026-03-26T15:00:00Z',
        },
        {
          id: 'menxia-1',
          name: '门下省',
          description: '代码审查',
          provider: 'gemini',
          status: 'running',
          models: [],
          createdAt: '2026-03-20T00:00:00Z',
          updatedAt: '2026-03-26T15:00:00Z',
        },
        {
          id: 'bingbu-1',
          name: '兵部',
          description: '代码实现',
          provider: 'openclaw',
          status: 'running',
          models: [],
          createdAt: '2026-03-22T00:00:00Z',
          updatedAt: '2026-03-26T15:30:00Z',
        },
      ]

      const mockApiClient = {
        listAgents: vi
          .fn()
          .mockResolvedValue({ items: mockAgents, total: 3, page: 1, pageSize: 100 }),
      } as unknown as OpenClawApiClient

      const { result } = renderHook(() => useArchitectureViewData(mockApiClient, false))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.collaborations.length).toBeGreaterThan(0)

      const zhongshuToMenxia = result.current.collaborations.find(
        c => c.fromAgentId === 'zhongshu-1' && c.toAgentId === 'menxia-1',
      )
      expect(zhongshuToMenxia).toBeDefined()
      expect(zhongshuToMenxia?.type).toBe('supervisor')

      const menxiaToBingbu = result.current.collaborations.find(
        c => c.fromAgentId === 'menxia-1' && c.toAgentId === 'bingbu-1',
      )
      expect(menxiaToBingbu).toBeDefined()
      expect(menxiaToBingbu?.type).toBe('downstream')
    })

    it('should generate peer collaborations within 兵部', async () => {
      const mockAgents: AgentInfo[] = [
        {
          id: 'bingbu-1',
          name: '兵部 1',
          description: '代码实现',
          provider: 'openclaw',
          status: 'running',
          models: [],
          createdAt: '2026-03-22T00:00:00Z',
          updatedAt: '2026-03-26T15:30:00Z',
        },
        {
          id: 'bingbu-2',
          name: '兵部 2',
          description: '单元测试',
          provider: 'opencode',
          status: 'running',
          models: [],
          createdAt: '2026-03-22T00:00:00Z',
          updatedAt: '2026-03-26T15:30:00Z',
        },
      ]

      const mockApiClient = {
        listAgents: vi
          .fn()
          .mockResolvedValue({ items: mockAgents, total: 2, page: 1, pageSize: 100 }),
      } as unknown as OpenClawApiClient

      const { result } = renderHook(() => useArchitectureViewData(mockApiClient, false))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const peerCollaboration = result.current.collaborations.find(c => c.type === 'peer')
      expect(peerCollaboration).toBeDefined()
    })
  })

  describe('refresh function', () => {
    it('should manually refresh data', async () => {
      let callCount = 0
      const mockAgents1: AgentInfo[] = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          description: '',
          provider: 'claude-code',
          status: 'running',
          models: [],
          createdAt: '2026-03-20T00:00:00Z',
          updatedAt: '2026-03-26T15:00:00Z',
        },
      ]
      const mockAgents2: AgentInfo[] = [
        {
          id: 'agent-1',
          name: 'Agent 1 Updated',
          description: '',
          provider: 'claude-code',
          status: 'running',
          models: [],
          createdAt: '2026-03-20T00:00:00Z',
          updatedAt: '2026-03-26T16:00:00Z',
        },
      ]

      const mockApiClient = {
        listAgents: vi.fn().mockImplementation(() => {
          callCount++
          return Promise.resolve({
            items: callCount === 1 ? mockAgents1 : mockAgents2,
            total: 1,
            page: 1,
            pageSize: 100,
          })
        }),
      } as unknown as OpenClawApiClient

      const { result } = renderHook(() => useArchitectureViewData(mockApiClient, false))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.nodes[0].name).toBe('Agent 1')

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.nodes[0].name).toBe('Agent 1 Updated')
    })
  })
})

describe('useArchitectureViewDataMock', () => {
  beforeEach(() => {})

  afterEach(() => {})

  it('should return mock data after loading', async () => {
    const { result } = renderHook(() => useArchitectureViewDataMock())

    expect(result.current.isLoading).toBe(true)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    expect(result.current.nodes.length).toBeGreaterThan(0)
    expect(result.current.error).toBe(null)
  })

  it('should include 三省六部 agents in mock data', async () => {
    const { result } = renderHook(() => useArchitectureViewDataMock())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    const providers = result.current.nodes.map(n => n.provider)
    expect(providers).toContain('claude-code')
    expect(providers).toContain('gemini')
    expect(providers).toContain('openclaw')
    expect(providers).toContain('opencode')
    expect(providers).toContain('codex')
  })

  it('should generate collaborations in mock data', async () => {
    const { result } = renderHook(() => useArchitectureViewDataMock())

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    expect(result.current.collaborations.length).toBeGreaterThan(0)
  })
})

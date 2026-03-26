/**
 * 架构视图数据 Hook
 * 
 * 从 Agent API 客户端获取 Agent 数据并转换为架构视图所需格式。
 * 
 * @packageDocumentation
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ArchitectureAgentNode, CollaborationLink } from './architecture/types'
import { AGENT_PROVIDERS } from './architecture/types'
import type { AgentInfo, AgentRuntimeStatus } from '@contexts/agent/infrastructure/openclaw-api/AgentApiTypes'
import type { OpenClawApiClient } from '@contexts/agent/infrastructure/openclaw-api/OpenClawApiClient'
import type { LabelColor } from '@shared/types/labelColor'
import type { Point } from '../types'

/**
 * 架构视图数据状态
 */
export interface ArchitectureViewDataState {
  /** Agent 节点列表 */
  nodes: ArchitectureAgentNode[]
  /** 协作关系列表 */
  collaborations: CollaborationLink[]
  /** 是否正在加载 */
  isLoading: boolean
  /** 错误信息 */
  error: Error | null
  /** 刷新数据 */
  refresh: () => Promise<void>
}

/**
 * 标签颜色循环列表
 */
const LABEL_COLORS: (LabelColor | null)[] = [
  'red',
  'orange',
  'amber',
  'green',
  'emerald',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  null,
]

/**
 * 根据 Agent ID 生成确定性位置
 * 
 * 使用简单的哈希算法确保相同 Agent 始终在相同位置。
 */
function generatePosition(agentId: string, index: number): Point {
  const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const gridWidth = 300
  const gridHeight = 200
  const gap = 50
  
  const col = index % 4
  const row = Math.floor(index / 4)
  
  return {
    x: 100 + col * (gridWidth + gap) + (hash % 30),
    y: 100 + row * (gridHeight + gap) + (Math.floor(hash / 30) % 20),
  }
}

/**
 * 根据 Agent ID 生成确定性标签颜色
 */
function generateLabelColor(agentId: string): LabelColor | null {
  const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return LABEL_COLORS[hash % LABEL_COLORS.length]
}

/**
 * 模拟协作关系生成
 * 
 * 根据 Agent 提供者类型生成合理的协作关系。
 * 实际应用中应从配置或历史数据中获取。
 */
function generateCollaborations(nodes: ArchitectureAgentNode[]): CollaborationLink[] {
  const collaborations: CollaborationLink[] = []
  
  // 根据三省六部制生成典型协作关系
  const zhongshu = nodes.filter(n => n.provider === 'claude-code' || n.provider === 'codex')
  const menxia = nodes.filter(n => n.provider === 'gemini')
  const bingbu = nodes.filter(n => n.provider === 'openclaw' || n.provider === 'opencode')
  
  // 中书省 -> 门下省 (审核)
  zhongshu.forEach(zhongshuNode => {
    menxia.forEach(menxiaNode => {
      collaborations.push({
        fromAgentId: zhongshuNode.id,
        toAgentId: menxiaNode.id,
        type: 'supervisor',
        strength: 0.8,
        description: '设计审核',
      })
    })
  })
  
  // 门下省 -> 兵部 (执行)
  menxia.forEach(menxiaNode => {
    bingbu.forEach(bingbuNode => {
      collaborations.push({
        fromAgentId: menxiaNode.id,
        toAgentId: bingbuNode.id,
        type: 'downstream',
        strength: 0.9,
        description: '任务执行',
      })
    })
  })
  
  // 兵部内部协作
  for (let i = 0; i < bingbu.length; i++) {
    for (let j = i + 1; j < bingbu.length; j++) {
      collaborations.push({
        fromAgentId: bingbu[i].id,
        toAgentId: bingbu[j].id,
        type: 'peer',
        strength: 0.6,
        description: '协作开发',
      })
    }
  }
  
  return collaborations
}

/**
 * 将 Agent API 数据转换为架构视图节点
 */
function mapAgentToNode(agent: AgentInfo, index: number): ArchitectureAgentNode {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    provider: agent.provider,
    status: agent.status as AgentRuntimeStatus,
    position: generatePosition(agent.id, index),
    width: 280,
    height: 120,
    labelColor: generateLabelColor(agent.id),
    collaborations: [], // 后续填充
    isSelected: false,
    isHighlighted: false,
    models: agent.models.map(m => m.id),
    lastActivityAt: agent.updatedAt,
  }
}

/**
 * 使用架构视图数据
 * 
 * 从 Agent API 客户端获取数据并转换为架构视图格式。
 * 
 * @param apiClient - Agent API 客户端实例 (可选)
 * @param autoRefresh - 是否自动刷新 (默认 true)
 * @param refreshInterval - 刷新间隔 (毫秒，默认 30000)
 * @returns 架构视图数据状态
 */
export function useArchitectureViewData(
  apiClient?: OpenClawApiClient,
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
): ArchitectureViewDataState {
  const [nodes, setNodes] = useState<ArchitectureAgentNode[]>([])
  const [collaborations, setCollaborations] = useState<CollaborationLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * 获取并转换 Agent 数据
   */
  const fetchData = useCallback(async () => {
    if (!apiClient) {
      // 如果没有 API 客户端，返回空数据
      setNodes([])
      setCollaborations([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.listAgents({
        page: 1,
        pageSize: 100,
      })

      const mappedNodes = result.items.map((agent, index) => mapAgentToNode(agent, index))
      const generatedCollaborations = generateCollaborations(mappedNodes)

      // 为每个节点填充协作关系
      const nodesWithCollaborations = mappedNodes.map(node => ({
        ...node,
        collaborations: generatedCollaborations.filter(
          link => link.fromAgentId === node.id || link.toAgentId === node.id
        ),
      }))

      setNodes(nodesWithCollaborations)
      setCollaborations(generatedCollaborations)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agent data'))
      // 发生错误时保留旧数据
    } finally {
      setIsLoading(false)
    }
  }, [apiClient])

  // 初始加载和自动刷新
  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh || !apiClient) {
      return
    }

    const intervalId = setInterval(fetchData, refreshInterval)
    return () => clearInterval(intervalId)
  }, [autoRefresh, apiClient, fetchData, refreshInterval])

  return useMemo(
    () => ({
      nodes,
      collaborations,
      isLoading,
      error,
      refresh: fetchData,
    }),
    [nodes, collaborations, isLoading, error, fetchData]
  )
}

/**
 * 使用模拟数据 (用于开发和测试)
 * 
 * @returns 架构视图数据状态
 */
export function useArchitectureViewDataMock(): ArchitectureViewDataState {
  const [isLoading, setIsLoading] = useState(true)

  const mockData = useMemo((): { nodes: ArchitectureAgentNode[]; collaborations: CollaborationLink[] } => {
    const mockAgents: AgentInfo[] = [
      {
        id: 'agent-zhongshu-001',
        name: '中书省 · 架构设计',
        description: '负责系统架构设计和方案制定',
        provider: 'claude-code',
        status: 'running',
        models: [
          { id: 'claude-sonnet-4-5-20250929', displayName: 'Claude Sonnet 4.5', description: 'Anthropic Claude Sonnet 4.5', isDefault: true },
        ],
        createdAt: '2026-03-20T00:00:00Z',
        updatedAt: '2026-03-26T15:00:00Z',
      },
      {
        id: 'agent-menxia-001',
        name: '门下省 · 代码审查',
        description: '负责代码审查和质量把关',
        provider: 'gemini',
        status: 'running',
        models: [
          { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', description: 'Google Gemini 2.5 Pro', isDefault: true },
        ],
        createdAt: '2026-03-20T00:00:00Z',
        updatedAt: '2026-03-26T14:30:00Z',
      },
      {
        id: 'agent-bingbu-001',
        name: '兵部 · 代码实现',
        description: '负责代码实现和单元测试',
        provider: 'openclaw',
        status: 'running',
        models: [
          { id: 'minimax-m2.7', displayName: 'MiniMax M2.7', description: 'MiniMax M2.7', isDefault: true },
        ],
        createdAt: '2026-03-22T00:00:00Z',
        updatedAt: '2026-03-26T15:30:00Z',
      },
      {
        id: 'agent-yushi-001',
        name: '御史台 · 独立测试',
        description: '负责独立测试和验证',
        provider: 'opencode',
        status: 'standby',
        models: [
          { id: 'gpt-4.1', displayName: 'GPT-4.1', description: 'OpenAI GPT-4.1', isDefault: true },
        ],
        createdAt: '2026-03-22T00:00:00Z',
        updatedAt: '2026-03-26T12:00:00Z',
      },
      {
        id: 'agent-xingbu-001',
        name: '刑部 · 安全审计',
        description: '负责安全审计和漏洞检测',
        provider: 'codex',
        status: 'running',
        models: [
          { id: 'o3-pro', displayName: 'o3 Pro', description: 'OpenAI o3 Pro', isDefault: true },
        ],
        createdAt: '2026-03-23T00:00:00Z',
        updatedAt: '2026-03-26T13:00:00Z',
      },
    ]

    const nodes = mockAgents.map((agent, index) => mapAgentToNode(agent, index))
    const collaborations = generateCollaborations(nodes)

    const nodesWithCollaborations = nodes.map(node => ({
      ...node,
      collaborations: collaborations.filter(
        link => link.fromAgentId === node.id || link.toAgentId === node.id
      ),
    }))

    return { nodes: nodesWithCollaborations, collaborations }
  }, [])

  useEffect(() => {
    const timerId = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timerId)
  }, [])

  return useMemo(
    () => ({
      nodes: mockData.nodes,
      collaborations: mockData.collaborations,
      isLoading,
      error: null,
      refresh: async () => {
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 500)
      },
    }),
    [mockData, isLoading]
  )
}

export default useArchitectureViewData

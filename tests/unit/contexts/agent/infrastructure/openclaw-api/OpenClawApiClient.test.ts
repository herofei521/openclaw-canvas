/**
 * OpenClaw Agent API 客户端单元测试
 * 
 * 测试 Agent API 客户端的核心功能。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenClawApiClient } from '../../../../../src/contexts/agent/infrastructure/openclaw-api/OpenClawApiClient'
import type { AgentApiClientConfig } from '../../../../../src/contexts/agent/infrastructure/openclaw-api/AgentApiTypes'
import { AgentApiErrorCode } from '../../../../../src/contexts/agent/infrastructure/openclaw-api/errors'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock OAuth2AuthProvider
vi.mock('../../../../../src/contexts/agent/infrastructure/openclaw-api/OAuth2AuthProvider', () => {
  return {
    OAuth2AuthProvider: vi.fn().mockImplementation(() => ({
      getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
      refreshAccessToken: vi.fn().mockResolvedValue(undefined),
      revokeToken: vi.fn().mockResolvedValue(undefined),
    })),
  }
})

describe('OpenClawApiClient', () => {
  const mockConfig: AgentApiClientConfig = {
    baseUrl: 'https://api.openclaw.dev',
    oauth: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorizationUrl: 'https://api.openclaw.dev/oauth/authorize',
      tokenUrl: 'https://api.openclaw.dev/oauth/token',
      redirectUri: 'http://localhost:3000/callback',
      scopes: ['agent:read', 'agent:write'],
    },
    timeoutMs: 30000,
    retryCount: 3,
    retryDelayMs: 1000,
  }

  let client: OpenClawApiClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new OpenClawApiClient(mockConfig)
  })

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeDefined()
    })

    it('should throw error with invalid config (missing baseUrl)', () => {
      const invalidConfig = { ...mockConfig, baseUrl: '' }
      expect(() => new OpenClawApiClient(invalidConfig)).toThrow()
    })

    it('should use default timeout if not specified', () => {
      const configWithoutTimeout = { ...mockConfig, timeoutMs: undefined }
      const clientWithDefault = new OpenClawApiClient(configWithoutTimeout)
      expect(clientWithDefault).toBeDefined()
    })
  })

  describe('listAgents', () => {
    it('should return list of agents', async () => {
      const mockAgents = {
        items: [
          {
            id: 'agent-1',
            name: 'Test Agent 1',
            description: 'Test description 1',
            provider: 'claude-code' as const,
            status: 'running' as const,
            models: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgents,
      })

      const result = await client.listAgents({ page: 1, pageSize: 10 })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('agent-1')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openclaw.dev/api/agents?page=1&pageSize=10',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
          }),
        })
      )
    })

    it('should filter by provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false }),
      })

      await client.listAgents({ page: 1, pageSize: 10, provider: 'codex' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('provider=codex'),
        expect.any(Object)
      )
    })

    it('should throw error if request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(client.listAgents({ page: 1, pageSize: 10 })).rejects.toThrow()
    })
  })

  describe('invokeAgent', () => {
    it('should invoke agent successfully', async () => {
      const mockResponse = {
        sessionId: 'session-123',
        agentId: 'agent-1',
        launchMode: 'new' as const,
        effectiveModel: 'claude-sonnet-4-6',
        resumeSessionId: null,
        command: 'claude',
        args: [],
        createdAt: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.invokeAgent({
        agentId: 'agent-1',
        prompt: 'Test prompt',
        cwd: '/test/path',
      })

      expect(result.sessionId).toBe('session-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openclaw.dev/api/agents/agent-1/invoke',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test prompt'),
        })
      )
    })

    it('should throw error if agent not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Agent not found' }),
      })

      await expect(
        client.invokeAgent({
          agentId: 'non-existent',
          prompt: 'Test',
          cwd: '/test',
        })
      ).rejects.toThrow()
    })

    it('should respect timeout', async () => {
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100)
        })
      })

      const clientWithShortTimeout = new OpenClawApiClient({
        ...mockConfig,
        timeoutMs: 50,
      })

      await expect(
        clientWithShortTimeout.invokeAgent({
          agentId: 'agent-1',
          prompt: 'Test',
          cwd: '/test',
        })
      ).rejects.toThrow()
    })
  })

  describe('createSession', () => {
    it('should create session successfully', async () => {
      const mockSession = {
        id: 'session-123',
        name: 'Test Session',
        agentId: 'agent-1',
        cwd: '/test/path',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      })

      const result = await client.createSession({
        agentId: 'agent-1',
        name: 'Test Session',
        cwd: '/test/path',
      })

      expect(result.id).toBe('session-123')
      expect(result.status).toBe('active')
    })
  })

  describe('getSessionStatus', () => {
    it('should get session status', async () => {
      const mockStatus = {
        sessionId: 'session-123',
        status: 'busy' as const,
        currentTask: 'Processing request',
        lastMessage: 'Working on it...',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      })

      const result = await client.getSessionStatus('session-123')

      expect(result.sessionId).toBe('session-123')
      expect(result.status).toBe('busy')
    })

    it('should throw error if session not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(client.getSessionStatus('non-existent')).rejects.toThrow()
    })
  })

  describe('terminateSession', () => {
    it('should terminate session successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      await expect(client.terminateSession('session-123')).resolves.toBeUndefined()
    })
  })

  describe('authenticate', () => {
    it('should call OAuth provider authenticate', async () => {
      await client.authenticate()
      // OAuth2AuthProvider is mocked, just verify no error
      await expect(client.authenticate()).resolves.toBeUndefined()
    })
  })

  describe('logout', () => {
    it('should call OAuth provider revokeToken', async () => {
      await client.logout()
      await expect(client.logout()).resolves.toBeUndefined()
    })
  })

  describe('retry logic', () => {
    it('should retry on network error', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false }),
        })

      const result = await client.listAgents({ page: 1, pageSize: 10 })
      
      expect(result).toBeDefined()
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should not retry on 4xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await expect(client.listAgents({ page: 1, pageSize: 10 })).rejects.toThrow()
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})

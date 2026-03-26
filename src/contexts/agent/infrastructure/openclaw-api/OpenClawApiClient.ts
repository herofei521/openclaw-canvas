/**
 * OpenClaw Agent API 客户端
 *
 * 提供与 OpenClaw Agent API 交互的完整客户端实现。
 * 支持 OAuth 2.0 认证、Agent 调用、会话管理等功能。
 *
 * @packageDocumentation
 */

import type {
  AgentApiClientConfig,
  AgentInfo,
  AgentInvokeRequest,
  AgentInvokeResponse,
  SessionConfig,
  SessionInfo,
  SessionStatusDetail,
  ListAgentsParams,
  ListSessionsParams,
  PaginatedResult,
  ApiResponse,
} from './AgentApiTypes'
import { OAuth2AuthProvider } from './OAuth2AuthProvider'
import {
  AgentApiError,
  createApiError,
  createAgentError,
  createSessionError,
  createNetworkError,
  createAuthError,
  AgentApiErrorCode,
} from './errors'

/**
 * 默认 API 超时时间 (毫秒)
 */
const DEFAULT_TIMEOUT_MS = 30000

/**
 * 默认重试次数
 */
const DEFAULT_RETRY_COUNT = 3

/**
 * 默认重试延迟 (毫秒)
 */
const DEFAULT_RETRY_DELAY_MS = 1000

/**
 * 可重试的 HTTP 状态码
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

/**
 * OpenClaw Agent API 客户端类
 *
 * 提供与 OpenClaw Agent API 交互的完整接口：
 * - OAuth 2.0 认证管理
 * - Agent 列表和状态查询
 * - Agent 调用
 * - 会话管理
 */
export class OpenClawApiClient {
  /** API 配置 */
  private readonly config: Required<AgentApiClientConfig>

  /** OAuth 2.0 认证提供者 */
  private readonly authProvider: OAuth2AuthProvider

  /**
   * 创建 API 客户端
   *
   * @param config - API 客户端配置
   * @throws 如果配置无效
   */
  constructor(config: AgentApiClientConfig) {
    this.validateConfig(config)

    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      oauth: config.oauth,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retryCount: config.retryCount ?? DEFAULT_RETRY_COUNT,
      retryDelayMs: config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
      enableLogging: config.enableLogging ?? false,
    }

    this.authProvider = new OAuth2AuthProvider(this.config.oauth)
  }

  /**
   * 验证 API 配置
   */
  private validateConfig(config: AgentApiClientConfig): void {
    if (!config.baseUrl || config.baseUrl.trim() === '') {
      throw new AgentApiError(AgentApiErrorCode.CLIENT_INVALID_CONFIG, 'baseUrl is required')
    }
  }

  /**
   * 记录日志
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.enableLogging) {
      console.log(`[OpenClawApiClient] ${message}`, ...args)
    }
  }

  /**
   * 认证
   *
   * 获取访问令牌。调用其他 API 前会自动调用此方法。
   *
   * @throws 如果认证失败
   */
  async authenticate(): Promise<void> {
    this.log('Authenticating...')
    await this.authProvider.getAccessToken()
    this.log('Authentication successful')
  }

  /**
   * 登出
   *
   * 撤销访问令牌。
   */
  async logout(): Promise<void> {
    this.log('Logging out...')
    await this.authProvider.revokeToken()
    this.log('Logout successful')
  }

  /**
   * 获取 Agent 列表
   *
   * @param params - 查询参数
   * @returns 分页的 Agent 列表
   * @throws 如果请求失败
   */
  async listAgents(params: ListAgentsParams): Promise<PaginatedResult<AgentInfo>> {
    this.log('Listing agents with params:', params)

    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
    })

    if (params.provider) {
      queryParams.append('provider', params.provider)
    }
    if (params.status) {
      queryParams.append('status', params.status)
    }
    if (params.keyword) {
      queryParams.append('keyword', params.keyword)
    }

    const response = await this.request<ApiResponse<PaginatedResult<AgentInfo>>>(
      `/api/agents?${queryParams.toString()}`,
      { method: 'GET' },
    )

    if (!response.success || !response.data) {
      throw createApiError(
        AgentApiErrorCode.API_INTERNAL_ERROR,
        response.error?.message || 'Failed to list agents',
      )
    }

    return response.data
  }

  /**
   * 调用 Agent
   *
   * @param request - 调用请求
   * @returns 调用响应
   * @throws 如果调用失败
   */
  async invokeAgent(request: AgentInvokeRequest): Promise<AgentInvokeResponse> {
    this.log('Invoking agent:', request.agentId)

    const response = await this.request<ApiResponse<AgentInvokeResponse>>(
      `/api/agents/${encodeURIComponent(request.agentId)}/invoke`,
      {
        method: 'POST',
        body: JSON.stringify({
          prompt: request.prompt,
          cwd: request.cwd,
          model: request.model,
          sessionId: request.sessionId,
          fullAccess: request.fullAccess,
          cols: request.cols,
          rows: request.rows,
        }),
      },
    )

    if (!response.success || !response.data) {
      throw createAgentError(
        AgentApiErrorCode.AGENT_INVOKE_FAILED,
        response.error?.message || 'Failed to invoke agent',
      )
    }

    return response.data
  }

  /**
   * 创建会话
   *
   * @param config - 会话配置
   * @returns 会话信息
   * @throws 如果创建失败
   */
  async createSession(config: SessionConfig): Promise<SessionInfo> {
    this.log('Creating session for agent:', config.agentId)

    const response = await this.request<ApiResponse<SessionInfo>>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        agentId: config.agentId,
        name: config.name,
        cwd: config.cwd,
        model: config.model,
        initialPrompt: config.initialPrompt,
        metadata: config.metadata,
      }),
    })

    if (!response.success || !response.data) {
      throw createSessionError(
        AgentApiErrorCode.SESSION_CREATE_FAILED,
        response.error?.message || 'Failed to create session',
      )
    }

    return response.data
  }

  /**
   * 获取会话状态
   *
   * @param sessionId - 会话 ID
   * @returns 会话状态详情
   * @throws 如果会话不存在
   */
  async getSessionStatus(sessionId: string): Promise<SessionStatusDetail> {
    this.log('Getting session status:', sessionId)

    const response = await this.request<ApiResponse<SessionStatusDetail>>(
      `/api/sessions/${encodeURIComponent(sessionId)}/status`,
      { method: 'GET' },
    )

    if (!response.success || !response.data) {
      if (response.error?.code === 'api.not_found') {
        throw createSessionError(
          AgentApiErrorCode.SESSION_NOT_FOUND,
          `Session ${sessionId} not found`,
        )
      }
      throw createSessionError(
        AgentApiErrorCode.SESSION_TERMINATED,
        response.error?.message || 'Failed to get session status',
      )
    }

    return response.data
  }

  /**
   * 终止会话
   *
   * @param sessionId - 会话 ID
   * @throws 如果终止失败
   */
  async terminateSession(sessionId: string): Promise<void> {
    this.log('Terminating session:', sessionId)

    await this.request<ApiResponse<void>>(
      `/api/sessions/${encodeURIComponent(sessionId)}/terminate`,
      { method: 'POST' },
    )
  }

  /**
   * 获取会话列表
   *
   * @param params - 查询参数
   * @returns 分页的会话列表
   * @throws 如果请求失败
   */
  async listSessions(params: ListSessionsParams): Promise<PaginatedResult<SessionInfo>> {
    this.log('Listing sessions with params:', params)

    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
    })

    if (params.agentId) {
      queryParams.append('agentId', params.agentId)
    }
    if (params.status) {
      queryParams.append('status', params.status)
    }
    if (params.cwd) {
      queryParams.append('cwd', params.cwd)
    }

    const response = await this.request<ApiResponse<PaginatedResult<SessionInfo>>>(
      `/api/sessions?${queryParams.toString()}`,
      { method: 'GET' },
    )

    if (!response.success || !response.data) {
      throw createApiError(
        AgentApiErrorCode.API_INTERNAL_ERROR,
        response.error?.message || 'Failed to list sessions',
      )
    }

    return response.data
  }

  /**
   * 发送 HTTP 请求
   *
   * @param path - API 路径
   * @param options - fetch 选项
   * @param retryCount - 当前重试次数
   * @returns 响应数据
   * @throws 如果请求失败
   */
  private async request<T>(path: string, options: RequestInit, retryCount: number = 0): Promise<T> {
    const url = `${this.config.baseUrl}${path}`

    const token = await this.authProvider.getAccessToken()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle retryable errors
      if (RETRYABLE_STATUS_CODES.includes(response.status) && retryCount < this.config.retryCount) {
        this.log(
          `Request failed with ${response.status}, retrying (${retryCount + 1}/${this.config.retryCount})`,
        )
        await this.delay(this.config.retryDelayMs * (retryCount + 1))
        return this.request<T>(path, options, retryCount + 1)
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw this.createErrorFromResponse(response.status, errorData)
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true, timestamp: new Date().toISOString() } as T
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw createNetworkError(
          AgentApiErrorCode.NETWORK_TIMEOUT,
          `Request to ${url} timed out after ${this.config.timeoutMs}ms`,
        )
      }

      // Retry on network errors
      if (retryCount < this.config.retryCount) {
        this.log(`Network error, retrying (${retryCount + 1}/${this.config.retryCount}):`, error)
        await this.delay(this.config.retryDelayMs * (retryCount + 1))
        return this.request<T>(path, options, retryCount + 1)
      }

      if (error instanceof AgentApiError) {
        throw error
      }

      throw createNetworkError(
        AgentApiErrorCode.NETWORK_CONNECTION_ERROR,
        `Failed to connect to ${url}`,
        { cause: error },
      )
    }
  }

  /**
   * 从响应创建错误
   */
  private createErrorFromResponse(status: number, data: Record<string, unknown>): AgentApiError {
    const errorMessage =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : 'Unknown error'

    switch (status) {
      case 400:
        return createApiError(AgentApiErrorCode.API_BAD_REQUEST, errorMessage)
      case 401:
      case 403:
        return createAuthError(AgentApiErrorCode.AUTH_UNAUTHORIZED, errorMessage)
      case 404:
        return createApiError(AgentApiErrorCode.API_NOT_FOUND, errorMessage)
      case 429:
        return createApiError(AgentApiErrorCode.API_RATE_LIMITED, errorMessage)
      default:
        return createApiError(AgentApiErrorCode.API_INTERNAL_ERROR, errorMessage, {
          httpStatus: status,
        })
    }
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Re-export types for convenience
export type {
  AgentApiClientConfig,
  AgentInfo,
  AgentInvokeRequest,
  AgentInvokeResponse,
  SessionConfig,
  SessionInfo,
  SessionStatusDetail,
  ListAgentsParams,
  ListSessionsParams,
  PaginatedResult,
} from './AgentApiTypes'

export { OAuth2AuthProvider } from './OAuth2AuthProvider'
export { AgentApiErrorCode, AgentApiError } from './errors'

/**
 * OpenClaw Agent API 类型定义
 * 
 * 本文件定义 OpenClaw Agent API 客户端使用的所有类型。
 * 包括认证、Agent 管理、会话管理等核心类型。
 * 
 * @packageDocumentation
 */

/**
 * OAuth 2.0 认证配置
 * 
 * 用于配置 OAuth 2.0 认证流程的参数。
 */
export interface OAuth2Config {
  /** OAuth 客户端 ID */
  clientId: string
  /** OAuth 客户端密钥 */
  clientSecret: string
  /** 授权端点 URL */
  authorizationUrl: string
  /** 令牌端点 URL */
  tokenUrl: string
  /** 重定向 URI */
  redirectUri: string
  /** 请求的权限范围 */
  scopes: string[]
}

/**
 * OAuth 2.0 令牌
 * 
 * 表示访问令牌和刷新令牌的信息。
 */
export interface OAuth2Token {
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌 */
  refreshToken: string
  /** 令牌过期时间戳 (毫秒) */
  expiresAt: number
  /** 令牌类型 */
  tokenType: 'Bearer'
  /** 令牌创建时间戳 (毫秒) */
  createdAt: number
}

/**
 * Agent 提供者 ID
 * 
 * 标识不同的 Agent 提供者。
 */
export type AgentProviderId = 
  | 'claude-code' 
  | 'codex' 
  | 'opencode' 
  | 'gemini'
  | 'openclaw'

/**
 * Agent 运行时状态
 * 
 * 表示 Agent 的当前运行状态。
 */
export type AgentRuntimeStatus =
  | 'running'      // 运行中
  | 'standby'      // 待机
  | 'exited'       // 已退出
  | 'failed'       // 失败
  | 'stopped'      // 已停止
  | 'restoring'    // 恢复中
  | 'initializing' // 初始化中

/**
 * Agent 基本信息
 * 
 * 表示一个 Agent 的基本元数据。
 */
export interface AgentInfo {
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
  /** 支持的模型列表 */
  models: AgentModelInfo[]
  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

/**
 * Agent 模型信息
 * 
 * 表示 Agent 支持的模型。
 */
export interface AgentModelInfo {
  /** 模型 ID */
  id: string
  /** 模型显示名称 */
  displayName: string
  /** 模型描述 */
  description: string
  /** 是否为默认模型 */
  isDefault: boolean
  /** 上下文窗口大小 (tokens) */
  contextWindow?: number
  /** 最大输出 tokens */
  maxOutputTokens?: number
}

/**
 * Agent 调用请求
 * 
 * 调用 Agent 执行任务的请求参数。
 */
export interface AgentInvokeRequest {
  /** Agent ID */
  agentId: string
  /** 用户提示/指令 */
  prompt: string
  /** 工作目录 */
  cwd: string
  /** 使用的模型 ID (可选，默认使用 Agent 默认模型) */
  model?: string
  /** 会话 ID (可选，用于继续之前会话) */
  sessionId?: string
  /** 是否允许完全访问 (谨慎使用) */
  fullAccess?: boolean
  /** 终端列数 */
  cols?: number
  /** 终端行数 */
  rows?: number
  /** 超时时间 (毫秒) */
  timeoutMs?: number
}

/**
 * Agent 调用响应
 * 
 * Agent 调用执行后的响应。
 */
export interface AgentInvokeResponse {
  /** 会话 ID */
  sessionId: string
  /** Agent ID */
  agentId: string
  /** 启动模式 */
  launchMode: 'new' | 'resume'
  /** 使用的模型 */
  effectiveModel: string | null
  /** 恢复的会话 ID */
  resumeSessionId: string | null
  /** 执行命令 */
  command: string
  /** 命令参数 */
  args: string[]
  /** 创建时间 */
  createdAt: string
}

/**
 * 会话配置
 * 
 * 创建新会话的配置参数。
 */
export interface SessionConfig {
  /** Agent ID */
  agentId: string
  /** 会话名称 */
  name?: string
  /** 工作目录 */
  cwd: string
  /** 使用的模型 */
  model?: string
  /** 初始提示 */
  initialPrompt?: string
  /** 会话元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 会话信息
 * 
 * 会话的基本信息。
 */
export interface SessionInfo {
  /** 会话 ID */
  id: string
  /** 会话名称 */
  name: string
  /** Agent ID */
  agentId: string
  /** 工作目录 */
  cwd: string
  /** 会话状态 */
  status: SessionStatus
  /** 创建时间 */
  createdAt: string
  /** 最后活动时间 */
  lastActivityAt: string
  /** 元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 会话状态
 * 
 * 表示会话的当前状态。
 */
export type SessionStatus =
  | 'active'      // 活跃
  | 'idle'        // 空闲
  | 'busy'        // 忙碌
  | 'completed'   // 已完成
  | 'error'       // 错误
  | 'terminated'  // 已终止

/**
 * 会话状态详情
 * 
 * 会话的详细状态信息。
 */
export interface SessionStatusDetail {
  /** 会话 ID */
  sessionId: string
  /** 会话状态 */
  status: SessionStatus
  /** 当前任务描述 */
  currentTask?: string
  /** 最后消息 */
  lastMessage?: string
  /** 错误信息 (如果有) */
  error?: string
  /** 资源使用情况 */
  resourceUsage?: {
    /** CPU 使用率 (%) */
    cpuPercent?: number
    /** 内存使用 (MB) */
    memoryMb?: number
    /** 运行时间 (秒) */
    uptimeSeconds?: number
  }
}

/**
 * Agent API 客户端配置
 * 
 * 配置 Agent API 客户端的参数。
 */
export interface AgentApiClientConfig {
  /** OpenClaw API 基础 URL */
  baseUrl: string
  /** OAuth 2.0 配置 */
  oauth: OAuth2Config
  /** 请求超时 (毫秒) */
  timeoutMs?: number
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟 (毫秒) */
  retryDelayMs?: number
  /** 是否启用日志 */
  enableLogging?: boolean
}

/**
 * API 错误描述
 * 
 * 表示 API 调用中的错误。
 */
export interface ApiErrorDescriptor {
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 详细调试消息 */
  debugMessage?: string
  /** 错误参数 */
  params?: Record<string, unknown>
  /** 堆栈跟踪 */
  stack?: string
}

/**
 * API 响应包装器
 * 
 * 统一的 API 响应格式。
 */
export interface ApiResponse<T> {
  /** 是否成功 */
  success: boolean
  /** 响应数据 */
  data?: T
  /** 错误信息 */
  error?: ApiErrorDescriptor
  /** 请求 ID (用于追踪) */
  requestId?: string
  /** 响应时间戳 */
  timestamp: string
}

/**
 * 分页参数
 * 
 * 用于分页查询的参数。
 */
export interface PaginationParams {
  /** 页码 (从 1 开始) */
  page: number
  /** 每页数量 */
  pageSize: number
}

/**
 * 分页结果
 * 
 * 分页查询的响应结果。
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[]
  /** 总数量 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPages: number
  /** 是否有下一页 */
  hasNextPage: boolean
  /** 是否有上一页 */
  hasPreviousPage: boolean
}

/**
 * Agent 列表查询参数
 */
export interface ListAgentsParams extends PaginationParams {
  /** 按提供者过滤 */
  provider?: AgentProviderId
  /** 按状态过滤 */
  status?: AgentRuntimeStatus
  /** 搜索关键词 */
  keyword?: string
}

/**
 * 会话列表查询参数
 */
export interface ListSessionsParams extends PaginationParams {
  /** 按 Agent ID 过滤 */
  agentId?: string
  /** 按状态过滤 */
  status?: SessionStatus
  /** 按工作目录过滤 */
  cwd?: string
}

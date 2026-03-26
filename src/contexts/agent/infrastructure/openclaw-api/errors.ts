/**
 * OpenClaw Agent API 错误定义
 * 
 * 本文件定义 Agent API 客户端使用的错误类型。
 */

import type { ApiErrorDescriptor } from './AgentApiTypes'

/**
 * Agent API 错误代码枚举
 */
export enum AgentApiErrorCode {
  // 认证错误
  AUTH_INVALID_CREDENTIALS = 'auth.invalid_credentials',
  AUTH_TOKEN_EXPIRED = 'auth.token_expired',
  AUTH_TOKEN_INVALID = 'auth.token_invalid',
  AUTH_REFRESH_FAILED = 'auth.refresh_failed',
  AUTH_UNAUTHORIZED = 'auth.unauthorized',
  
  // 网络错误
  NETWORK_TIMEOUT = 'network.timeout',
  NETWORK_UNREACHABLE = 'network.unreachable',
  NETWORK_CONNECTION_ERROR = 'network.connection_error',
  
  // API 错误
  API_NOT_FOUND = 'api.not_found',
  API_METHOD_NOT_ALLOWED = 'api.method_not_allowed',
  API_INTERNAL_ERROR = 'api.internal_error',
  API_RATE_LIMITED = 'api.rate_limited',
  API_BAD_REQUEST = 'api.bad_request',
  
  // Agent 错误
  AGENT_NOT_FOUND = 'agent.not_found',
  AGENT_UNAVAILABLE = 'agent.unavailable',
  AGENT_INVOKE_FAILED = 'agent.invoke_failed',
  AGENT_TIMEOUT = 'agent.timeout',
  
  // 会话错误
  SESSION_NOT_FOUND = 'session.not_found',
  SESSION_TERMINATED = 'session.terminated',
  SESSION_CREATE_FAILED = 'session.create_failed',
  
  // 客户端错误
  CLIENT_NOT_CONFIGURED = 'client.not_configured',
  CLIENT_INVALID_CONFIG = 'client.invalid_config',
}

/**
 * Agent API 错误类
 * 
 * 表示 Agent API 调用中的错误。
 */
export class AgentApiError extends Error {
  /** 错误代码 */
  public readonly code: AgentApiErrorCode
  
  /** 错误描述符 */
  public readonly descriptor: ApiErrorDescriptor
  
  /** HTTP 状态码 (如果适用) */
  public readonly httpStatus?: number
  
  /** 原始错误 (如果适用) */
  public readonly cause?: unknown
  
  constructor(
    code: AgentApiErrorCode,
    message: string,
    options?: {
      httpStatus?: number
      debugMessage?: string
      params?: Record<string, unknown>
      cause?: unknown
    }
  ) {
    super(message)
    this.name = 'AgentApiError'
    this.code = code
    this.httpStatus = options?.httpStatus
    this.cause = options?.cause
    
    this.descriptor = {
      code,
      message,
      debugMessage: options?.debugMessage,
      params: options?.params,
      stack: this.stack,
    }
    
    // 保持正确的原型链
    Object.setPrototypeOf(this, AgentApiError.prototype)
  }
  
  /**
   * 将错误转换为描述符
   */
  toDescriptor(): ApiErrorDescriptor {
    return this.descriptor
  }
  
  /**
   * 检查是否是认证错误
   */
  isAuthError(): boolean {
    return this.code.startsWith('auth.')
  }
  
  /**
   * 检查是否是网络错误
   */
  isNetworkError(): boolean {
    return this.code.startsWith('network.')
  }
  
  /**
   * 检查是否是 API 错误
   */
  isApiError(): boolean {
    return this.code.startsWith('api.')
  }
  
  /**
   * 检查是否是可重试错误
   */
  isRetryable(): boolean {
    const retryableCodes = [
      AgentApiErrorCode.NETWORK_TIMEOUT,
      AgentApiErrorCode.NETWORK_UNREACHABLE,
      AgentApiErrorCode.NETWORK_CONNECTION_ERROR,
      AgentApiErrorCode.API_RATE_LIMITED,
      AgentApiErrorCode.API_INTERNAL_ERROR,
    ]
    return retryableCodes.includes(this.code)
  }
}

/**
 * 创建认证错误
 */
export function createAuthError(
  code: AgentApiErrorCode,
  message: string,
  options?: {
    httpStatus?: number
    debugMessage?: string
    cause?: unknown
  }
): AgentApiError {
  return new AgentApiError(code, message, options)
}

/**
 * 创建网络错误
 */
export function createNetworkError(
  code: AgentApiErrorCode,
  message: string,
  options?: {
    httpStatus?: number
    debugMessage?: string
    cause?: unknown
  }
): AgentApiError {
  return new AgentApiError(code, message, options)
}

/**
 * 创建 API 错误
 */
export function createApiError(
  code: AgentApiErrorCode,
  message: string,
  options?: {
    httpStatus?: number
    debugMessage?: string
    params?: Record<string, unknown>
    cause?: unknown
  }
): AgentApiError {
  return new AgentApiError(code, message, options)
}

/**
 * 创建 Agent 错误
 */
export function createAgentError(
  code: AgentApiErrorCode,
  message: string,
  options?: {
    httpStatus?: number
    debugMessage?: string
    params?: Record<string, unknown>
    cause?: unknown
  }
): AgentApiError {
  return new AgentApiError(code, message, options)
}

/**
 * 创建会话错误
 */
export function createSessionError(
  code: AgentApiErrorCode,
  message: string,
  options?: {
    httpStatus?: number
    debugMessage?: string
    params?: Record<string, unknown>
    cause?: unknown
  }
): AgentApiError {
  return new AgentApiError(code, message, options)
}

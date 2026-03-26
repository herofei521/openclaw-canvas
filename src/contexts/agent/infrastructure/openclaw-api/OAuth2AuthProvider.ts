/**
 * OAuth 2.0 认证提供者
 * 
 * 实现 OAuth 2.0 认证流程，包括令牌获取、刷新和撤销。
 * 支持 Authorization Code 流程和 PKCE 扩展。
 * 
 * @packageDocumentation
 */

import type { OAuth2Config, OAuth2Token } from './AgentApiTypes'
import {
  AgentApiError,
  createAuthError,
  createNetworkError,
  AgentApiErrorCode,
} from './errors'

/**
 * 令牌存储键名
 */
const TOKEN_STORAGE_KEY = 'openclaw_oauth_token'

/**
 * PKCE code verifier 存储键名
 */
const PKCE_VERIFIER_STORAGE_KEY = 'openclaw_pkce_verifier'

/**
 * 加密密钥存储键名
 */
const ENCRYPTION_KEY_STORAGE_KEY = 'openclaw_encryption_key'

/**
 * 令牌刷新缓冲时间 (毫秒)
 * 在令牌实际过期前这个时间开始刷新
 */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

/**
 * 请求超时时间 (毫秒)
 */
const REQUEST_TIMEOUT_MS = 30000

/**
 * OAuth 2.0 认证提供者类
 * 
 * 负责管理 OAuth 2.0 认证流程，包括：
 * - 获取访问令牌
 * - 刷新过期令牌
 * - 撤销令牌
 * - 生成授权 URL
 */
export class OAuth2AuthProvider {
  /** OAuth 2.0 配置 */
  private readonly config: OAuth2Config
  
  /** 内存中的令牌缓存 */
  private tokenCache: OAuth2Token | null = null
  
  /** 令牌加载/保存状态 */
  private tokenLoadPromise: Promise<OAuth2Token | null> | null = null
  private tokenSavePromise: Promise<void> | null = null

  /**
   * 创建 OAuth 2.0 认证提供者
   * 
   * @param config - OAuth 2.0 配置
   * @throws 如果配置无效
   */
  constructor(config: OAuth2Config) {
    this.validateConfig(config)
    this.config = config
  }

  /**
   * 验证 OAuth 2.0 配置
   * 
   * @param config - 要验证的配置
   * @throws 如果配置无效
   */
  private validateConfig(config: OAuth2Config): void {
    if (!config.clientId || config.clientId.trim() === '') {
      throw new AgentApiError(
        AgentApiErrorCode.CLIENT_INVALID_CONFIG,
        'OAuth 2.0 clientId is required'
      )
    }

    if (!config.tokenUrl || config.tokenUrl.trim() === '') {
      throw new AgentApiError(
        AgentApiErrorCode.CLIENT_INVALID_CONFIG,
        'OAuth 2.0 tokenUrl is required'
      )
    }

    if (!config.authorizationUrl || config.authorizationUrl.trim() === '') {
      throw new AgentApiError(
        AgentApiErrorCode.CLIENT_INVALID_CONFIG,
        'OAuth 2.0 authorizationUrl is required'
      )
    }

    if (!config.redirectUri || config.redirectUri.trim() === '') {
      throw new AgentApiError(
        AgentApiErrorCode.CLIENT_INVALID_CONFIG,
        'OAuth 2.0 redirectUri is required'
      )
    }
  }

  /**
   * 获取访问令牌
   * 
   * 如果已有未过期的令牌则返回缓存的令牌，
   * 否则请求新令牌或刷新过期令牌。
   * 
   * @returns 访问令牌字符串
   * @throws 如果认证失败
   */
  async getAccessToken(): Promise<string> {
    const token = await this.loadToken()

    if (token && !this.isTokenExpired(token)) {
      return token.accessToken
    }

    if (token && token.refreshToken) {
      try {
        await this.refreshAccessToken()
        const refreshedToken = await this.loadToken()
        if (refreshedToken) {
          return refreshedToken.accessToken
        }
      } catch (error) {
        // Refresh failed, will request new token
        console.warn('Token refresh failed, requesting new token:', error)
      }
    }

    await this.requestNewToken()
    const newToken = await this.loadToken()
    
    if (!newToken) {
      throw createAuthError(
        AgentApiErrorCode.AUTH_TOKEN_INVALID,
        'Failed to obtain access token'
      )
    }

    return newToken.accessToken
  }

  /**
   * 刷新访问令牌
   * 
   * 使用刷新令牌获取新的访问令牌。
   * 
   * @throws 如果刷新失败
   */
  async refreshAccessToken(): Promise<void> {
    const currentToken = await this.loadToken()

    if (!currentToken || !currentToken.refreshToken) {
      throw createAuthError(
        AgentApiErrorCode.AUTH_REFRESH_FAILED,
        'No refresh token available'
      )
    }

    try {
      const response = await this.makeTokenRequest({
        grant_type: 'refresh_token',
        refresh_token: currentToken.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: this.config.scopes.join(' '),
      })

      const newToken = this.parseTokenResponse(response, currentToken.refreshToken)
      await this.saveToken(newToken)
    } catch (error) {
      if (error instanceof AgentApiError) {
        throw error
      }
      throw createAuthError(
        AgentApiErrorCode.AUTH_REFRESH_FAILED,
        'Failed to refresh access token',
        { cause: error }
      )
    }
  }

  /**
   * 撤销令牌
   * 
   * 撤销当前的访问令牌和刷新令牌。
   * 即使撤销请求失败也不会抛出错误。
   */
  async revokeToken(): Promise<void> {
    const token = await this.loadToken()

    if (!token) {
      return
    }

    try {
      const revokeUrl = this.buildRevokeUrl()
      
      await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: token.accessToken,
          token_type_hint: 'access_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }).toString(),
      })

      // Also try to revoke refresh token if available
      if (token.refreshToken) {
        await fetch(revokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: token.refreshToken,
            token_type_hint: 'refresh_token',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
          }).toString(),
        })
      }
    } catch (error) {
      // Don't throw on revoke failure, just log it
      console.warn('Token revocation failed:', error)
    } finally {
      // Always clear local token
      await this.saveToken(null)
      this.tokenCache = null
    }
  }

  /**
   * 获取授权 URL
   * 
   * 生成用于用户授权的重定向 URL。
   * 如果启用 PKCE，会同时保存 code verifier 供后续交换令牌使用。
   * 
   * @param state - 状态参数，用于防止 CSRF
   * @param usePkce - 是否使用 PKCE 扩展 (默认 false)
   * @returns 授权 URL
   */
  async getAuthorizationUrl(state: string, usePkce: boolean = false): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state: state,
    })

    if (usePkce) {
      const { codeVerifier, codeChallenge, codeChallengeMethod } = await this.generatePkceParams()
      params.append('code_challenge', codeChallenge)
      params.append('code_challenge_method', codeChallengeMethod)
      // 保存 code verifier 供后续交换令牌时使用
      await this.savePkceVerifier(codeVerifier)
    }

    return `${this.config.authorizationUrl}?${params.toString()}`
  }

  /**
   * 保存 PKCE code verifier
   * 
   * @param verifier - code verifier 字符串
   */
  private async savePkceVerifier(verifier: string): Promise<void> {
    try {
      localStorage.setItem(PKCE_VERIFIER_STORAGE_KEY, verifier)
    } catch (error) {
      console.warn('Failed to save PKCE verifier:', error)
    }
  }

  /**
   * 加载 PKCE code verifier
   * 
   * @returns code verifier 或 null
   */
  private loadPkceVerifier(): string | null {
    try {
      return localStorage.getItem(PKCE_VERIFIER_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to load PKCE verifier:', error)
      return null
    }
  }

  /**
   * 清除 PKCE code verifier
   * 
   * 在成功交换令牌后应调用此方法
   */
  private clearPkceVerifier(): void {
    try {
      localStorage.removeItem(PKCE_VERIFIER_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear PKCE verifier:', error)
    }
  }

  /**
   * 使用授权码交换令牌
   * 
   * 在用户授权后，使用授权码换取访问令牌。
   * 如果未提供 codeVerifier，会尝试从存储中加载（PKCE 流程）。
   * 
   * @param code - 授权码
   * @param state - 状态参数，用于验证 (未使用，保留用于接口兼容)
   * @param codeVerifier - PKCE code verifier (如果使用了 PKCE，可选)
   * @returns OAuth 2.0 令牌
   * @throws 如果交换失败
   */
  async exchangeCodeForToken(
    code: string,
    _state: string,
    codeVerifier?: string
  ): Promise<OAuth2Token> {
    try {
      // 如果未提供 verifier，尝试从存储中加载（PKCE 流程）
      const verifier = codeVerifier || this.loadPkceVerifier()
      
      const body: Record<string, string> = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }

      if (verifier) {
        body.code_verifier = verifier
        // 成功后清除 verifier（一次性使用）
        this.clearPkceVerifier()
      }

      const response = await this.makeTokenRequest(body)
      const token = this.parseTokenResponse(response)
      await this.saveToken(token)
      
      return token
    } catch (error) {
      if (error instanceof AgentApiError) {
        throw error
      }
      throw createAuthError(
        AgentApiErrorCode.AUTH_INVALID_CREDENTIALS,
        'Failed to exchange authorization code for token',
        { cause: error }
      )
    }
  }

  /**
   * 检查令牌是否过期
   * 
   * @param token - 要检查的令牌
   * @param bufferMs - 缓冲时间 (毫秒)，默认使用类常量
   * @returns 如果令牌过期或即将过期返回 true
   */
  isTokenExpired(token: OAuth2Token, bufferMs: number = TOKEN_REFRESH_BUFFER_MS): boolean {
    const now = Date.now()
    return token.expiresAt <= now + bufferMs
  }

  /**
   * 构建令牌撤销 URL
   */
  private buildRevokeUrl(): string {
    // Try to derive revoke URL from token URL
    const tokenUrl = new URL(this.config.tokenUrl)
    tokenUrl.pathname = tokenUrl.pathname.replace(/\/token$/, '/revoke')
    return tokenUrl.toString()
  }

  /**
   * 生成 PKCE 参数
   * 
   * 实现 RFC 7636 PKCE 规范：
   * - code_verifier: 32 字节随机数，base64url 编码
   * - code_challenge: SHA256(code_verifier) 的 base64url 编码
   * 
   * @returns code verifier, code challenge 和 method
   */
  private async generatePkceParams(): Promise<{ 
    codeVerifier: string
    codeChallenge: string
    codeChallengeMethod: string 
  }> {
    // 生成 32 字节随机数作为 code verifier
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const codeVerifier = this.base64UrlEncode(array)
    
    // 对 code verifier 进行 SHA256 哈希
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = new Uint8Array(hashBuffer)
    
    // 将哈希结果进行 base64url 编码作为 code challenge
    const codeChallenge = this.base64UrlEncode(hashArray)
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
    }
  }

  /**
   * Base64URL 编码
   * 
   * 将 Uint8Array 转换为 base64url 编码字符串（RFC 4648）
   * 移除填充字符 '='，将 '+' 替换为 '-'，将 '/' 替换为 '_'
   * 
   * @param buffer - 要编码的字节数组
   * @returns base64url 编码的字符串
   */
  private base64UrlEncode(buffer: Uint8Array): string {
    // 使用 Array.from 避免 downlevelIteration 问题
    const base64 = btoa(Array.from(buffer, byte => String.fromCharCode(byte)).join(''))
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Base64URL 解码
   * 
   * 将 base64url 编码字符串解码为 Uint8Array
   * 
   * @param base64url - base64url 编码的字符串
   * @returns 解码后的字节数组
   */
  private base64UrlDecode(base64url: string): Uint8Array {
    // 恢复填充
    let base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const padLength = (4 - (base64.length % 4)) % 4
    base64 += '='.repeat(padLength)
    
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  /**
   * 获取或生成加密密钥
   * 
   * 使用 AES-GCM 256 位加密
   * 密钥存储在 localStorage 中（加密状态）
   * 
   * @returns CryptoKey 用于加密/解密
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    // 尝试从存储中加载密钥
    const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY)
    
    if (storedKey) {
      try {
        const keyData = this.base64UrlDecode(storedKey)
        return await crypto.subtle.importKey(
          'raw',
          keyData.buffer as ArrayBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        )
      } catch (error) {
        console.warn('Failed to load encryption key, generating new one:', error)
      }
    }
    
    // 生成新密钥
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    // 导出并存储密钥
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    const keyBase64 = this.base64UrlEncode(new Uint8Array(exportedKey))
    localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, keyBase64)
    
    return key
  }

  /**
   * 加密数据
   * 
   * 使用 AES-GCM 加密字符串数据
   * 
   * @param data - 要加密的字符串
   * @returns 加密后的字符串（包含 IV）
   */
  private async encryptData(data: string): Promise<string> {
    const key = await this.getEncryptionKey()
    const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
    
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(data)
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    )
    
    // 组合 IV + 密文，然后 base64url 编码
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return this.base64UrlEncode(combined)
  }

  /**
   * 解密数据
   * 
   * 使用 AES-GCM 解密字符串数据
   * 
   * @param encryptedData - 加密的字符串（包含 IV）
   * @returns 解密后的字符串
   */
  private async decryptData(encryptedData: string): Promise<string> {
    const key = await this.getEncryptionKey()
    const combined = this.base64UrlDecode(encryptedData)
    
    // 分离 IV 和密文
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  /**
   * 发出令牌请求
   * 
   * @param params - 请求参数
   * @returns 响应数据
   * @throws 如果请求失败
   */
  private async makeTokenRequest(params: Record<string, string>): Promise<Record<string, unknown>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams(params).toString(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createAuthError(
          AgentApiErrorCode.AUTH_INVALID_CREDENTIALS,
          errorData.error_description || errorData.error || 'Token request failed',
          { httpStatus: response.status }
        )
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw createNetworkError(
          AgentApiErrorCode.NETWORK_TIMEOUT,
          'Token request timed out'
        )
      }
      
      if (error instanceof AgentApiError) {
        throw error
      }
      
      throw createNetworkError(
        AgentApiErrorCode.NETWORK_CONNECTION_ERROR,
        'Failed to connect to token endpoint',
        { cause: error }
      )
    }
  }

  /**
   * 解析令牌响应
   * 
   * @param data - 响应数据
   * @param existingRefreshToken - 现有的刷新令牌 (用于刷新场景)
   * @returns OAuth 2.0 令牌对象
   */
  private parseTokenResponse(
    data: Record<string, unknown>,
    existingRefreshToken?: string
  ): OAuth2Token {
    const expiresIn = data.expires_in as number | undefined
    const expiresAt = expiresIn 
      ? Date.now() + expiresIn * 1000
      : Date.now() + 3600 * 1000 // Default 1 hour

    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) || existingRefreshToken || '',
      expiresAt: expiresAt,
      tokenType: (data.token_type as string) === 'Bearer' ? 'Bearer' : 'Bearer',
      createdAt: Date.now(),
    }
  }

  /**
   * 加载令牌
   * 
   * 从存储中加载令牌，使用内存缓存。
   * 令牌在存储中是加密的。
   * 
   * @returns 令牌或 null
   */
  private async loadToken(): Promise<OAuth2Token | null> {
    if (this.tokenCache) {
      return this.tokenCache
    }

    if (this.tokenLoadPromise) {
      return this.tokenLoadPromise
    }

    this.tokenLoadPromise = (async () => {
      try {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
        if (stored) {
          // 解密存储的令牌
          const decrypted = await this.decryptData(stored)
          const token = JSON.parse(decrypted) as OAuth2Token
          this.tokenCache = token
          return token
        }
      } catch (error) {
        console.warn('Failed to load token from storage:', error)
      } finally {
        this.tokenLoadPromise = null
      }
      return null
    })()

    return this.tokenLoadPromise
  }

  /**
   * 保存令牌
   * 
   * 将令牌加密后保存到存储中。
   * 
   * @param token - 要保存的令牌，null 表示清除
   */
  private async saveToken(token: OAuth2Token | null): Promise<void> {
    if (this.tokenSavePromise) {
      await this.tokenSavePromise
    }

    this.tokenSavePromise = (async () => {
      try {
        if (token) {
          // 加密令牌后存储
          const encrypted = await this.encryptData(JSON.stringify(token))
          localStorage.setItem(TOKEN_STORAGE_KEY, encrypted)
          this.tokenCache = token
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          this.tokenCache = null
        }
      } catch (error) {
        console.warn('Failed to save token to storage:', error)
      } finally {
        this.tokenSavePromise = null
      }
    })()

    await this.tokenSavePromise
  }

  /**
   * 请求新令牌
   * 
   * 使用客户端凭证请求新令牌。
   * 这通常用于客户端凭证流程或服务端流程。
   * 
   * @throws 如果请求失败
   */
  private async requestNewToken(): Promise<void> {
    try {
      const response = await this.makeTokenRequest({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: this.config.scopes.join(' '),
      })

      const token = this.parseTokenResponse(response)
      await this.saveToken(token)
    } catch (error) {
      if (error instanceof AgentApiError) {
        throw error
      }
      throw createAuthError(
        AgentApiErrorCode.AUTH_INVALID_CREDENTIALS,
        'Failed to request new access token',
        { cause: error }
      )
    }
  }
}

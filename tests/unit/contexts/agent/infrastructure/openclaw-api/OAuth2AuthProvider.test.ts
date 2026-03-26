/**
 * OAuth2AuthProvider 单元测试
 * 
 * 测试 OAuth 2.0 认证提供者的功能。
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { OAuth2AuthProvider } from '../../../../../src/contexts/agent/infrastructure/openclaw-api/OAuth2AuthProvider'
import type { OAuth2Config, OAuth2Token } from '../../../../../src/contexts/agent/infrastructure/openclaw-api/AgentApiTypes'
import { AgentApiErrorCode } from '../../../../../src/contexts/agent/infrastructure/openclaw-api/errors'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('OAuth2AuthProvider', () => {
  const mockConfig: OAuth2Config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    authorizationUrl: 'https://api.openclaw.dev/oauth/authorize',
    tokenUrl: 'https://api.openclaw.dev/oauth/token',
    redirectUri: 'http://localhost:3000/callback',
    scopes: ['agent:read', 'agent:write', 'session:manage'],
  }

  const mockToken: OAuth2Token = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000, // 1 hour from now
    tokenType: 'Bearer',
    createdAt: Date.now(),
  }

  let provider: OAuth2AuthProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new OAuth2AuthProvider(mockConfig)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeDefined()
    })

    it('should throw error with invalid config (missing clientId)', () => {
      const invalidConfig = { ...mockConfig, clientId: '' }
      expect(() => new OAuth2AuthProvider(invalidConfig)).toThrow()
    })

    it('should throw error with invalid config (missing tokenUrl)', () => {
      const invalidConfig = { ...mockConfig, tokenUrl: '' }
      expect(() => new OAuth2AuthProvider(invalidConfig)).toThrow()
    })
  })

  describe('getAccessToken', () => {
    it('should return cached token if not expired', async () => {
      // Set a cached token
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(mockToken)

      const token = await provider.getAccessToken()

      expect(token).toBe(mockToken.accessToken)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should request new token if no cached token', async () => {
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(null)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      })

      const token = await provider.getAccessToken()

      expect(token).toBe('new-access-token')
      expect(mockFetch).toHaveBeenCalledWith(
        mockConfig.tokenUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
        })
      )
    })

    it('should refresh token if expired', async () => {
      const expiredToken: OAuth2Token = {
        ...mockToken,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      }
      
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(expiredToken)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'refreshed-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      })

      const token = await provider.getAccessToken()

      expect(token).toBe('refreshed-access-token')
    })

    it('should throw auth error if token request fails', async () => {
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(null)
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'invalid_client',
          error_description: 'Client authentication failed',
        }),
      })

      await expect(provider.getAccessToken()).rejects.toThrow()
    })

    it('should throw network error if fetch fails', async () => {
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(null)
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(provider.getAccessToken()).rejects.toThrow()
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const currentToken: OAuth2Token = {
        ...mockToken,
        refreshToken: 'current-refresh-token',
      }
      
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(currentToken)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      })

      await provider.refreshAccessToken()

      expect(mockFetch).toHaveBeenCalledWith(
        mockConfig.tokenUrl,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('grant_type=refresh_token'),
        })
      )
    })

    it('should throw error if no refresh token available', async () => {
      const tokenWithoutRefresh: OAuth2Token = {
        ...mockToken,
        refreshToken: '',
      }
      
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(tokenWithoutRefresh)

      await expect(provider.refreshAccessToken()).rejects.toThrow()
    })

    it('should throw error if refresh request fails', async () => {
      const currentToken: OAuth2Token = {
        ...mockToken,
        refreshToken: 'current-refresh-token',
      }
      
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(currentToken)
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Refresh token is invalid or expired',
        }),
      })

      await expect(provider.refreshAccessToken()).rejects.toThrow()
    })
  })

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(mockToken)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      await provider.revokeToken()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('revoke'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('token='),
        })
      )
    })

    it('should clear cached token after revocation', async () => {
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(mockToken)
      const saveTokenSpy = vi.spyOn(provider as any, 'saveToken').mockResolvedValue(undefined)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      await provider.revokeToken()

      expect(saveTokenSpy).toHaveBeenCalledWith(null)
    })

    it('should not throw if revoke request fails', async () => {
      vi.spyOn(provider as any, 'loadToken').mockResolvedValue(mockToken)
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Should not throw
      await expect(provider.revokeToken()).resolves.toBeUndefined()
    })
  })

  describe('getAuthorizationUrl', () => {
    it('should return authorization URL with correct parameters', () => {
      const url = provider.getAuthorizationUrl('test-state')

      expect(url).toContain(mockConfig.authorizationUrl)
      expect(url).toContain('client_id=' + mockConfig.clientId)
      expect(url).toContain('redirect_uri=' + encodeURIComponent(mockConfig.redirectUri))
      expect(url).toContain('state=test-state')
      expect(url).toContain('scope=' + encodeURIComponent(mockConfig.scopes.join(' ')))
      expect(url).toContain('response_type=code')
    })

    it('should include code_challenge if PKCE is enabled', () => {
      const url = provider.getAuthorizationUrl('test-state', true)

      expect(url).toContain('code_challenge=')
      expect(url).toContain('code_challenge_method=S256')
    })
  })

  describe('exchangeCodeForToken', () => {
    it('should exchange authorization code for token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      })

      const token = await provider.exchangeCodeForToken('auth-code', 'test-state')

      expect(mockFetch).toHaveBeenCalledWith(
        mockConfig.tokenUrl,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('grant_type=authorization_code'),
          body: expect.stringContaining('code=auth-code'),
        })
      )

      expect(token.accessToken).toBe('access-token')
    })

    it('should throw error if exchange fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_grant',
        }),
      })

      await expect(provider.exchangeCodeForToken('invalid-code', 'test-state')).rejects.toThrow()
    })
  })

  describe('isTokenExpired', () => {
    it('should return true if token is expired', () => {
      const expiredToken: OAuth2Token = {
        ...mockToken,
        expiresAt: Date.now() - 1000,
      }

      expect((provider as any).isTokenExpired(expiredToken)).toBe(true)
    })

    it('should return false if token is not expired', () => {
      expect((provider as any).isTokenExpired(mockToken)).toBe(false)
    })

    it('should return true if token expires within buffer time', () => {
      const soonExpiringToken: OAuth2Token = {
        ...mockToken,
        expiresAt: Date.now() + 30000, // 30 seconds from now
      }

      expect((provider as any).isTokenExpired(soonExpiringToken, 60000)).toBe(true)
    })
  })
})

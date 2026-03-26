/**
 * OpenClaw Agent API 客户端
 * 
 * 提供与 OpenClaw Agent API 交互的完整客户端实现。
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * // 创建客户端
 * const client = new OpenClawApiClient({
 *   baseUrl: 'https://api.openclaw.dev',
 *   oauth: {
 *     clientId: 'your-client-id',
 *     clientSecret: 'your-client-secret',
 *     authorizationUrl: 'https://api.openclaw.dev/oauth/authorize',
 *     tokenUrl: 'https://api.openclaw.dev/oauth/token',
 *     redirectUri: 'http://localhost:3000/callback',
 *     scopes: ['agent:read', 'agent:write'],
 *   },
 * })
 * 
 * // 调用 Agent
 * const response = await client.invokeAgent({
 *   agentId: 'bingbu_coder',
 *   prompt: 'Hello, please help me with this task...',
 *   cwd: '/path/to/project',
 * })
 * ```
 */

export { OpenClawApiClient } from './OpenClawApiClient'
export { OAuth2AuthProvider } from './OAuth2AuthProvider'
export {
  AgentApiErrorCode,
  AgentApiError,
  createAuthError,
  createNetworkError,
  createApiError,
  createAgentError,
  createSessionError,
} from './errors'
export type * from './AgentApiTypes'

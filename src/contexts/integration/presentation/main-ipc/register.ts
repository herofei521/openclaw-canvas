import { ipcMain, net } from 'electron'
import { IPC_CHANNELS } from '../../../../shared/contracts/ipc'
import type {
  ResolveGitHubPullRequestsInput,
  ResolveGitHubPullRequestsResult,
} from '../../../../shared/contracts/dto'
import type { IpcRegistrationDisposable } from '../../../../app/main/ipc/types'
import { registerHandledIpc } from '../../../../app/main/ipc/handle'
import type { ApprovedWorkspaceStore } from '../../../workspace/infrastructure/approval/ApprovedWorkspaceStore'
import { createAppError } from '../../../../shared/errors/appError'
import { resolveGitHubPullRequests } from '../../infrastructure/github/GitHubPullRequestGhService'
import { normalizeResolveGitHubPullRequestsPayload } from './validate'

export interface OpenClawTestConnectionInput {
  gatewayUrl: string
}

export interface OpenClawTestConnectionResult {
  success: boolean
  message: string
  error?: string
}

async function testOpenClawConnection(gatewayUrl: string): Promise<OpenClawTestConnectionResult> {
  try {
    const url = `${gatewayUrl.replace(/\/$/, '')}/health`
    return await new Promise((resolve) => {
      const request = net.request({
        method: 'GET',
        url,
      })
      
      request.on('response', (response) => {
        if (response.statusCode === 200) {
          resolve({ success: true, message: 'Connection successful' })
        } else {
          resolve({
            success: false,
            message: `HTTP ${response.statusCode}`,
            error: `HTTP_${response.statusCode}`,
          })
        }
      })
      
      request.on('error', (error) => {
        resolve({
          success: false,
          message: error.message || 'Connection failed',
          error: error.message || 'CONNECTION_FAILED',
        })
      })
      
      // Set timeout
      setTimeout(() => {
        request.abort()
        resolve({
          success: false,
          message: 'Connection timeout',
          error: 'TIMEOUT',
        })
      }, 5000)
      
      request.end()
    })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
      error: error instanceof Error ? error.message : 'CONNECTION_FAILED',
    }
  }
}

export function registerIntegrationIpcHandlers(
  approvedWorkspaces: ApprovedWorkspaceStore,
): IpcRegistrationDisposable {
  registerHandledIpc(
    IPC_CHANNELS.integrationGithubResolvePullRequests,
    async (
      _event,
      payload: ResolveGitHubPullRequestsInput,
    ): Promise<ResolveGitHubPullRequestsResult> => {
      const normalized = normalizeResolveGitHubPullRequestsPayload(payload)
      const isApproved = await approvedWorkspaces.isPathApproved(normalized.repoPath)
      if (!isApproved) {
        throw createAppError('common.approved_path_required', {
          debugMessage:
            'integration:github:resolve-pull-requests repoPath is outside approved workspaces',
        })
      }

      return await resolveGitHubPullRequests(normalized)
    },
    { defaultErrorCode: 'integration.github.resolve_failed' },
  )

  registerHandledIpc(
    IPC_CHANNELS.openclawTestConnection,
    async (
      _event,
      payload: OpenClawTestConnectionInput,
    ): Promise<OpenClawTestConnectionResult> => {
      return await testOpenClawConnection(payload.gatewayUrl)
    },
    { defaultErrorCode: 'openclaw.connection_test_failed' },
  )

  return {
    dispose: () => {
      ipcMain.removeHandler(IPC_CHANNELS.integrationGithubResolvePullRequests)
      ipcMain.removeHandler(IPC_CHANNELS.openclawTestConnection)
    },
  }
}

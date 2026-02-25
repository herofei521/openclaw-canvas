import { mkdir } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { dialog, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../../shared/constants/ipc'
import type { EnsureDirectoryInput, WorkspaceDirectory } from '../../../../shared/types/api'
import type { IpcRegistrationDisposable } from '../../../ipc/types'
import { createApprovedWorkspaceStore } from '../ApprovedWorkspaceStore'
import { normalizeEnsureDirectoryPayload } from './validate'

export function registerWorkspaceIpcHandlers(): IpcRegistrationDisposable {
  const approvedWorkspaces = createApprovedWorkspaceStore()

  ipcMain.handle(
    IPC_CHANNELS.workspaceSelectDirectory,
    async (): Promise<WorkspaceDirectory | null> => {
      if (process.env.COVE_TEST_WORKSPACE) {
        const testWorkspacePath = resolve(process.env.COVE_TEST_WORKSPACE)
        await approvedWorkspaces.registerRoot(testWorkspacePath)
        return {
          id: crypto.randomUUID(),
          name: basename(testWorkspacePath),
          path: testWorkspacePath,
        }
      }

      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      const workspacePath = result.filePaths[0]
      const pathChunks = workspacePath.split(/[\\/]/)
      const workspaceName = pathChunks[pathChunks.length - 1] || workspacePath

      await approvedWorkspaces.registerRoot(workspacePath)

      return {
        id: crypto.randomUUID(),
        name: workspaceName,
        path: workspacePath,
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.workspaceEnsureDirectory,
    async (_event, payload: EnsureDirectoryInput) => {
      const normalized = normalizeEnsureDirectoryPayload(payload)

      const isApproved = await approvedWorkspaces.isPathApproved(normalized.path)
      if (!isApproved) {
        throw new Error('workspace:ensure-directory path is outside approved workspaces')
      }

      await mkdir(normalized.path, { recursive: true })
    },
  )

  return {
    dispose: () => {
      ipcMain.removeHandler(IPC_CHANNELS.workspaceSelectDirectory)
      ipcMain.removeHandler(IPC_CHANNELS.workspaceEnsureDirectory)
    },
  }
}

import React, { useMemo } from 'react'

function resolveWorktreesRoot(workspacePath: string, worktreesRoot: string): string {
  const trimmed = worktreesRoot.trim()
  if (trimmed.length === 0) {
    return `${workspacePath.replace(/[\\/]+$/, '')}/.cove/worktrees`
  }
  if (/^([a-zA-Z]:[\\/]|\/)/.test(trimmed)) {
    return trimmed.replace(/[\\/]+$/, '')
  }
  const base = workspacePath.replace(/[\\/]+$/, '')
  const normalizedCustom = trimmed
    .replace(/^[.][\\/]+/, '')
    .replace(/^[\\/]+/, '')
    .replace(/[\\/]+$/, '')
  return `${base}/${normalizedCustom}`
}

function getFolderName(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] || path
}

export function WorkspaceSection({
  workspacePath,
  worktreesRoot,
  onChangeWorktreesRoot,
}: {
  workspacePath: string
  worktreesRoot: string
  onChangeWorktreesRoot: (worktreesRoot: string) => void
}): React.JSX.Element {
  const folderName = useMemo(() => getFolderName(workspacePath), [workspacePath])
  const resolvedRoot = useMemo(
    () => resolveWorktreesRoot(workspacePath, worktreesRoot),
    [workspacePath, worktreesRoot],
  )

  return (
    <div className="settings-panel__section" id="settings-section-workspace">
      <h3 className="settings-panel__section-title">{folderName}</h3>

      <div className="settings-panel__row">
        <div className="settings-panel__row-label">
          <strong>Project Path</strong>
          <span>Full filesystem path to the project root.</span>
        </div>
        <div className="settings-panel__control">
          <span
            style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all', textAlign: 'right' }}
          >
            {workspacePath}
          </span>
        </div>
      </div>

      <div className="settings-panel__row">
        <div className="settings-panel__row-label">
          <strong>Worktree Root</strong>
          <span>Relative or absolute path for agent worktrees.</span>
        </div>
        <div
          className="settings-panel__control"
          style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}
        >
          <input
            value={worktreesRoot}
            placeholder=".cove/worktrees"
            onChange={event => onChangeWorktreesRoot(event.target.value)}
          />
          <button
            type="button"
            className="secondary"
            disabled={worktreesRoot.trim().length === 0}
            onClick={() => onChangeWorktreesRoot('')}
          >
            Reset to Default
          </button>
        </div>
      </div>

      <div className="settings-panel__row">
        <div className="settings-panel__row-label">
          <strong>Resolved Path</strong>
          <span>The actual path where worktrees will be created.</span>
        </div>
        <div className="settings-panel__control">
          <span
            style={{ fontSize: '12px', color: '#888', wordBreak: 'break-all', textAlign: 'right' }}
          >
            {resolvedRoot}
          </span>
        </div>
      </div>
    </div>
  )
}

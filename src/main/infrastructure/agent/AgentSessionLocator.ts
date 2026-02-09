import fs from 'node:fs/promises'
import os from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import type { AgentProviderId } from '../../../shared/types/api'

interface LocateAgentResumeSessionInput {
  provider: AgentProviderId
  cwd: string
  startedAtMs: number
  timeoutMs?: number
}

const POLL_INTERVAL_MS = 200
const DEFAULT_TIMEOUT_MS = 2600

function toDateDirectoryParts(timestampMs: number): [string, string, string] {
  const date = new Date(timestampMs)
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return [year, month, day]
}

function wait(durationMs: number): Promise<void> {
  return new Promise(resolveWait => {
    setTimeout(resolveWait, durationMs)
  })
}

async function listFiles(directory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    return entries.filter(entry => entry.isFile()).map(entry => join(directory, entry.name))
  } catch {
    return []
  }
}

function normalizeSessionIdFromPath(filePath: string): string | null {
  if (extname(filePath) !== '.jsonl') {
    return null
  }

  const name = basename(filePath, '.jsonl').trim()
  return name.length > 0 ? name : null
}

async function readFirstLine(filePath: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const [firstLine] = raw.split('\n', 1)
    return firstLine?.trim() ?? null
  } catch {
    return null
  }
}

async function findClaudeResumeSessionId(cwd: string, startedAtMs: number): Promise<string | null> {
  const claudeProjectsDir = join(os.homedir(), '.claude', 'projects')
  const encodedPath = resolve(cwd).replace(/[\\/]/g, '-').replace(/:/g, '')
  const projectDir = join(claudeProjectsDir, encodedPath)

  const files = (await listFiles(projectDir)).filter(file => file.endsWith('.jsonl'))
  if (files.length === 0) {
    return null
  }

  const candidates = await Promise.all(
    files.map(async file => {
      try {
        const stats = await fs.stat(file)
        return {
          file,
          mtimeMs: stats.mtimeMs,
        }
      } catch {
        return null
      }
    }),
  )

  const latest = candidates
    .filter((item): item is { file: string; mtimeMs: number } => item !== null)
    .filter(item => item.mtimeMs >= startedAtMs - 6000)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0]

  if (!latest) {
    return null
  }

  return normalizeSessionIdFromPath(latest.file)
}

async function findCodexResumeSessionId(cwd: string, startedAtMs: number): Promise<string | null> {
  const codexSessionsDir = join(os.homedir(), '.codex', 'sessions')
  const resolvedCwd = resolve(cwd)

  const dateCandidates = new Set<string>()
  const now = Date.now()
  const timestamps = [startedAtMs, now, now - 24 * 60 * 60 * 1000]

  for (const timestamp of timestamps) {
    const [year, month, day] = toDateDirectoryParts(timestamp)
    dateCandidates.add(join(codexSessionsDir, year, month, day))
  }

  const files = (
    await Promise.all(
      [...dateCandidates].map(async directory => {
        const directoryFiles = await listFiles(directory)
        return directoryFiles.filter(file => basename(file).startsWith('rollout-'))
      }),
    )
  ).flat()

  if (files.length === 0) {
    return null
  }

  const candidates = await Promise.all(
    files.map(async file => {
      try {
        const stats = await fs.stat(file)
        if (stats.mtimeMs < startedAtMs - 60_000) {
          return null
        }

        const firstLine = await readFirstLine(file)
        if (!firstLine) {
          return null
        }

        const parsed = JSON.parse(firstLine) as {
          payload?: {
            id?: unknown
            cwd?: unknown
          }
        }

        const sessionId = typeof parsed.payload?.id === 'string' ? parsed.payload.id.trim() : null
        const sessionCwd =
          typeof parsed.payload?.cwd === 'string' ? resolve(parsed.payload.cwd) : null

        if (!sessionId || sessionCwd !== resolvedCwd) {
          return null
        }

        return {
          sessionId,
          mtimeMs: stats.mtimeMs,
        }
      } catch {
        return null
      }
    }),
  )

  const latest = candidates
    .filter((item): item is { sessionId: string; mtimeMs: number } => item !== null)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0]

  return latest?.sessionId ?? null
}

async function tryFindResumeSessionId(
  provider: AgentProviderId,
  cwd: string,
  startedAtMs: number,
): Promise<string | null> {
  if (provider === 'claude-code') {
    return await findClaudeResumeSessionId(cwd, startedAtMs)
  }

  return await findCodexResumeSessionId(cwd, startedAtMs)
}

async function pollResumeSessionId(
  provider: AgentProviderId,
  cwd: string,
  startedAtMs: number,
  deadline: number,
): Promise<string | null> {
  const detected = await tryFindResumeSessionId(provider, cwd, startedAtMs)
  if (detected) {
    return detected
  }

  if (Date.now() > deadline) {
    return null
  }

  await wait(POLL_INTERVAL_MS)
  return await pollResumeSessionId(provider, cwd, startedAtMs, deadline)
}

export async function locateAgentResumeSessionId({
  provider,
  cwd,
  startedAtMs,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: LocateAgentResumeSessionInput): Promise<string | null> {
  const deadline = Date.now() + timeoutMs
  return await pollResumeSessionId(provider, cwd, startedAtMs, deadline)
}

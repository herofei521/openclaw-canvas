import type { Node } from '@xyflow/react'
import type { AgentNodeData, TerminalNodeData } from '../../features/workspace/types'
import { resolveInitialAgentRuntimeStatus } from '../../features/workspace/utils/agentRuntimeStatus'
import {
  clearResumeSessionBinding,
  isResumeSessionBindingVerified,
} from '../../features/workspace/utils/agentResumeBinding'
import { toAgentNodeTitle, toErrorMessage } from './format'

interface HydrateAgentNodeInput {
  node: Node<TerminalNodeData>
  workspacePath: string
  agentFullAccess: boolean
}

interface FailedAgentFallbackInput {
  node: Node<TerminalNodeData>
  cwd: string
  agent: AgentNodeData
  errorMessage: string
}

async function fallbackToFailedAgentTerminal({
  node,
  cwd,
  agent,
  errorMessage,
}: FailedAgentFallbackInput): Promise<Node<TerminalNodeData>> {
  const now = new Date().toISOString()

  try {
    const fallback = await window.coveApi.pty.spawn({
      cwd,
      cols: 80,
      rows: 24,
    })

    return {
      ...node,
      data: {
        ...node.data,
        sessionId: fallback.sessionId,
        status: 'failed' as const,
        endedAt: now,
        exitCode: null,
        lastError: errorMessage,
        scrollback: node.data.scrollback,
        agent,
      },
    }
  } catch (fallbackError) {
    return {
      ...node,
      data: {
        ...node.data,
        sessionId: '',
        status: 'failed' as const,
        endedAt: now,
        exitCode: null,
        lastError: `${errorMessage}. Fallback terminal failed: ${toErrorMessage(fallbackError)}`,
        scrollback: node.data.scrollback,
        agent,
      },
    }
  }
}

export async function hydrateAgentNode({
  node,
  workspacePath,
  agentFullAccess,
}: HydrateAgentNodeInput): Promise<Node<TerminalNodeData>> {
  if (node.data.kind !== 'agent' || !node.data.agent) {
    return node
  }

  const hasActiveAgentStatus =
    node.data.status === 'running' ||
    node.data.status === 'standby' ||
    node.data.status === 'restoring'
  const hasVerifiedResumeBinding = isResumeSessionBindingVerified(node.data.agent)
  const sanitizedAgent = hasVerifiedResumeBinding
    ? node.data.agent
    : {
        ...node.data.agent,
        ...clearResumeSessionBinding(),
      }
  const shouldAutoResumeAgent = hasActiveAgentStatus && hasVerifiedResumeBinding
  const shouldRelaunchBlankAgent =
    hasActiveAgentStatus && !hasVerifiedResumeBinding && sanitizedAgent.prompt.trim().length === 0

  if (shouldAutoResumeAgent) {
    try {
      const restoredAgent = await window.coveApi.agent.launch({
        provider: sanitizedAgent.provider,
        cwd: sanitizedAgent.executionDirectory,
        prompt: sanitizedAgent.prompt,
        mode: 'resume',
        model: sanitizedAgent.model,
        resumeSessionId: sanitizedAgent.resumeSessionId,
        agentFullAccess,
        cols: 80,
        rows: 24,
      })

      return {
        ...node,
        data: {
          ...node.data,
          sessionId: restoredAgent.sessionId,
          title: toAgentNodeTitle(sanitizedAgent.provider, restoredAgent.effectiveModel),
          status: resolveInitialAgentRuntimeStatus(sanitizedAgent.prompt),
          endedAt: null,
          exitCode: null,
          lastError: null,
          scrollback: node.data.scrollback,
          startedAt: node.data.startedAt ?? new Date().toISOString(),
          agent: {
            ...sanitizedAgent,
            effectiveModel: restoredAgent.effectiveModel,
            launchMode: restoredAgent.launchMode,
            resumeSessionId: restoredAgent.resumeSessionId ?? sanitizedAgent.resumeSessionId,
            resumeSessionIdVerified: true,
          },
        },
      }
    } catch (error) {
      return fallbackToFailedAgentTerminal({
        node,
        cwd: workspacePath,
        agent: sanitizedAgent,
        errorMessage: `Resume failed: ${toErrorMessage(error)}`,
      })
    }
  }

  if (shouldRelaunchBlankAgent) {
    try {
      const relaunchedAgent = await window.coveApi.agent.launch({
        provider: sanitizedAgent.provider,
        cwd: sanitizedAgent.executionDirectory,
        prompt: sanitizedAgent.prompt,
        mode: 'new',
        model: sanitizedAgent.model,
        agentFullAccess,
        cols: 80,
        rows: 24,
      })

      return {
        ...node,
        data: {
          ...node.data,
          sessionId: relaunchedAgent.sessionId,
          title: toAgentNodeTitle(sanitizedAgent.provider, relaunchedAgent.effectiveModel),
          status: resolveInitialAgentRuntimeStatus(sanitizedAgent.prompt),
          startedAt: new Date().toISOString(),
          endedAt: null,
          exitCode: null,
          lastError: null,
          scrollback: null,
          agent: {
            ...sanitizedAgent,
            effectiveModel: relaunchedAgent.effectiveModel,
            launchMode: relaunchedAgent.launchMode,
            ...clearResumeSessionBinding(),
          },
        },
      }
    } catch (error) {
      return fallbackToFailedAgentTerminal({
        node,
        cwd: sanitizedAgent.executionDirectory,
        agent: sanitizedAgent,
        errorMessage: `Blank agent relaunch failed: ${toErrorMessage(error)}`,
      })
    }
  }

  try {
    const spawned = await window.coveApi.pty.spawn({
      cwd: sanitizedAgent.executionDirectory,
      cols: 80,
      rows: 24,
    })

    return {
      ...node,
      data: {
        ...node.data,
        sessionId: spawned.sessionId,
        status: hasActiveAgentStatus ? ('stopped' as const) : node.data.status,
        endedAt: hasActiveAgentStatus
          ? (node.data.endedAt ?? new Date().toISOString())
          : node.data.endedAt,
        lastError: null,
        agent: sanitizedAgent,
      },
    }
  } catch (error) {
    return fallbackToFailedAgentTerminal({
      node,
      cwd: workspacePath,
      agent: sanitizedAgent,
      errorMessage: `Terminal spawn failed: ${toErrorMessage(error)}`,
    })
  }
}

/**
 * 架构视图类型测试
 * 
 * 测试类型定义和工具函数的正确性。
 */

import { describe, it, expect } from 'vitest'
import {
  getAgentStatusColor,
  getAgentStatusLabel,
  getCollaborationColor,
  getCollaborationLabel,
  getCollaborationStrokeStyle,
  AGENT_PROVIDERS,
  DEFAULT_ARCHITECTURE_VIEW_CONFIG,
} from '@contexts/workspace/presentation/renderer/components/workspaceCanvas/architecture/types'
import type { AgentRuntimeStatus, CollaborationType } from '@contexts/workspace/presentation/renderer/components/workspaceCanvas/architecture/types'

describe('Architecture Types', () => {
  describe('getAgentStatusColor', () => {
    it('should return green for running status', () => {
      expect(getAgentStatusColor('running')).toBe('#22c55e')
    })

    it('should return yellow for standby status', () => {
      expect(getAgentStatusColor('standby')).toBe('#eab308')
    })

    it('should return gray for exited status', () => {
      expect(getAgentStatusColor('exited')).toBe('#6b7280')
    })

    it('should return red for failed status', () => {
      expect(getAgentStatusColor('failed')).toBe('#ef4444')
    })

    it('should return gray for stopped status', () => {
      expect(getAgentStatusColor('stopped')).toBe('#9ca3af')
    })

    it('should return blue for restoring status', () => {
      expect(getAgentStatusColor('restoring')).toBe('#3b82f6')
    })

    it('should return violet for initializing status', () => {
      expect(getAgentStatusColor('initializing')).toBe('#8b5cf6')
    })
  })

  describe('getAgentStatusLabel', () => {
    it('should return Chinese label for running status', () => {
      expect(getAgentStatusLabel('running')).toBe('运行中')
    })

    it('should return Chinese label for standby status', () => {
      expect(getAgentStatusLabel('standby')).toBe('待机')
    })

    it('should return Chinese label for failed status', () => {
      expect(getAgentStatusLabel('failed')).toBe('失败')
    })

    it('should return Chinese label for unknown status', () => {
      expect(getAgentStatusLabel('exited' as AgentRuntimeStatus)).toBe('已退出')
    })
  })

  describe('getCollaborationColor', () => {
    it('should return blue for upstream', () => {
      expect(getCollaborationColor('upstream')).toBe('#3b82f6')
    })

    it('should return emerald for downstream', () => {
      expect(getCollaborationColor('downstream')).toBe('#10b981')
    })

    it('should return violet for peer', () => {
      expect(getCollaborationColor('peer')).toBe('#8b5cf6')
    })

    it('should return amber for supervisor', () => {
      expect(getCollaborationColor('supervisor')).toBe('#f59e0b')
    })

    it('should return red for auditor', () => {
      expect(getCollaborationColor('auditor')).toBe('#ef4444')
    })
  })

  describe('getCollaborationLabel', () => {
    it('should return Chinese label for upstream', () => {
      expect(getCollaborationLabel('upstream')).toBe('上游')
    })

    it('should return Chinese label for downstream', () => {
      expect(getCollaborationLabel('downstream')).toBe('下游')
    })

    it('should return Chinese label for peer', () => {
      expect(getCollaborationLabel('peer')).toBe('协作')
    })

    it('should return Chinese label for supervisor', () => {
      expect(getCollaborationLabel('supervisor')).toBe('监督')
    })

    it('should return Chinese label for auditor', () => {
      expect(getCollaborationLabel('auditor')).toBe('审计')
    })
  })

  describe('getCollaborationStrokeStyle', () => {
    it('should return solid line for upstream', () => {
      const style = getCollaborationStrokeStyle('upstream')
      expect(style.strokeDasharray).toBe('0')
      expect(style.strokeWidth).toBe(2)
    })

    it('should return solid line for downstream', () => {
      const style = getCollaborationStrokeStyle('downstream')
      expect(style.strokeDasharray).toBe('0')
      expect(style.strokeWidth).toBe(2)
    })

    it('should return dashed line for peer', () => {
      const style = getCollaborationStrokeStyle('peer')
      expect(style.strokeDasharray).toBe('5,5')
      expect(style.strokeWidth).toBe(2)
    })

    it('should return dotted line for supervisor', () => {
      const style = getCollaborationStrokeStyle('supervisor')
      expect(style.strokeDasharray).toBe('2,2')
      expect(style.strokeWidth).toBe(3)
    })

    it('should return dash-dot line for auditor', () => {
      const style = getCollaborationStrokeStyle('auditor')
      expect(style.strokeDasharray).toBe('1,4')
      expect(style.strokeWidth).toBe(2)
    })
  })

  describe('AGENT_PROVIDERS', () => {
    it('should have claude-code provider', () => {
      expect(AGENT_PROVIDERS['claude-code']).toBeDefined()
      expect(AGENT_PROVIDERS['claude-code'].displayName).toBe('Claude Code')
    })

    it('should have codex provider', () => {
      expect(AGENT_PROVIDERS.codex).toBeDefined()
      expect(AGENT_PROVIDERS.codex.displayName).toBe('Codex')
    })

    it('should have opencode provider', () => {
      expect(AGENT_PROVIDERS.opencode).toBeDefined()
      expect(AGENT_PROVIDERS.opencode.displayName).toBe('OpenCode')
    })

    it('should have gemini provider', () => {
      expect(AGENT_PROVIDERS.gemini).toBeDefined()
      expect(AGENT_PROVIDERS.gemini.displayName).toBe('Gemini')
    })

    it('should have openclaw provider', () => {
      expect(AGENT_PROVIDERS.openclaw).toBeDefined()
      expect(AGENT_PROVIDERS.openclaw.displayName).toBe('OpenClaw')
    })

    it('should have all required properties for each provider', () => {
      Object.values(AGENT_PROVIDERS).forEach(provider => {
        expect(provider).toHaveProperty('id')
        expect(provider).toHaveProperty('displayName')
        expect(provider).toHaveProperty('iconName')
        expect(provider).toHaveProperty('description')
      })
    })
  })

  describe('DEFAULT_ARCHITECTURE_VIEW_CONFIG', () => {
    it('should have showAgentRelations enabled by default', () => {
      expect(DEFAULT_ARCHITECTURE_VIEW_CONFIG.showAgentRelations).toBe(true)
    })

    it('should have showSpaceBoundaries enabled by default', () => {
      expect(DEFAULT_ARCHITECTURE_VIEW_CONFIG.showSpaceBoundaries).toBe(true)
    })

    it('should have highlightActiveAgents enabled by default', () => {
      expect(DEFAULT_ARCHITECTURE_VIEW_CONFIG.highlightActiveAgents).toBe(true)
    })

    it('should have empty collapsedSpaces by default', () => {
      expect(DEFAULT_ARCHITECTURE_VIEW_CONFIG.collapsedSpaces).toEqual([])
    })

    it('should have showStatusIndicators enabled by default', () => {
      expect(DEFAULT_ARCHITECTURE_VIEW_CONFIG.showStatusIndicators).toBe(true)
    })

    it('should have showAgentDetails disabled by default', () => {
      expect(DEFAULT_ARCHITECTURE_VIEW_CONFIG.showAgentDetails).toBe(false)
    })
  })
})

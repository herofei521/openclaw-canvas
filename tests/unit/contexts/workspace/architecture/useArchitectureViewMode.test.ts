/**
 * 架构视图模式 Hook 测试
 * 
 * 测试 useArchitectureViewMode Hook 的功能。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useArchitectureViewMode } from '@contexts/workspace/presentation/renderer/components/workspaceCanvas/architecture/useArchitectureViewMode'
import type { Point } from '@contexts/workspace/presentation/renderer/types'

describe('useArchitectureViewMode', () => {
  beforeEach(() => {
    // 重置所有钩子状态
  })

  describe('initialization', () => {
    it('should initialize with default mode', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      expect(result.current.viewMode).toBe('default')
    })

    it('should initialize with custom mode', () => {
      const { result } = renderHook(() => useArchitectureViewMode('architecture'))
      
      expect(result.current.viewMode).toBe('architecture')
    })

    it('should have default config values', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      expect(result.current.architectureState.config.showAgentRelations).toBe(true)
      expect(result.current.architectureState.config.showSpaceBoundaries).toBe(true)
      expect(result.current.architectureState.config.highlightActiveAgents).toBe(true)
      expect(result.current.architectureState.config.collapsedSpaces).toEqual([])
    })
  })

  describe('view mode switching', () => {
    it('should switch to default view', () => {
      const { result } = renderHook(() => useArchitectureViewMode('architecture'))
      
      act(() => {
        result.current.switchToDefault()
      })
      
      expect(result.current.viewMode).toBe('default')
    })

    it('should switch to architecture view', () => {
      const { result } = renderHook(() => useArchitectureViewMode('default'))
      
      act(() => {
        result.current.switchToArchitecture()
      })
      
      expect(result.current.viewMode).toBe('architecture')
    })

    it('should toggle view mode', () => {
      const { result } = renderHook(() => useArchitectureViewMode('default'))
      
      act(() => {
        result.current.toggleViewMode()
      })
      
      expect(result.current.viewMode).toBe('architecture')
      
      act(() => {
        result.current.toggleViewMode()
      })
      
      expect(result.current.viewMode).toBe('default')
    })
  })

  describe('config updates', () => {
    it('should update config partially', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.updateConfig({ showAgentDetails: true })
      })
      
      expect(result.current.architectureState.config.showAgentDetails).toBe(true)
      expect(result.current.architectureState.config.showAgentRelations).toBe(true) // unchanged
    })

    it('should update multiple config values', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.updateConfig({
          showAgentDetails: true,
          showAgentRelations: false,
          highlightActiveAgents: false,
        })
      })
      
      expect(result.current.architectureState.config.showAgentDetails).toBe(true)
      expect(result.current.architectureState.config.showAgentRelations).toBe(false)
      expect(result.current.architectureState.config.highlightActiveAgents).toBe(false)
    })

    it('should reset config to defaults', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.updateConfig({
          showAgentDetails: true,
          showAgentRelations: false,
          collapsedSpaces: ['space1', 'space2'],
        })
      })
      
      act(() => {
        result.current.resetConfig()
      })
      
      expect(result.current.architectureState.config.showAgentDetails).toBe(false)
      expect(result.current.architectureState.config.showAgentRelations).toBe(true)
      expect(result.current.architectureState.config.collapsedSpaces).toEqual([])
    })
  })

  describe('agent selection', () => {
    it('should select single agent', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.selectAgent('agent1')
      })
      
      expect(result.current.architectureState.selectedAgentIds).toEqual(['agent1'])
    })

    it('should replace selection when selecting another agent', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.selectAgent('agent1')
        result.current.selectAgent('agent2')
      })
      
      expect(result.current.architectureState.selectedAgentIds).toEqual(['agent2'])
    })

    it('should add to selection with multi-select', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.selectAgent('agent1', false)
        result.current.selectAgent('agent2', true)
      })
      
      expect(result.current.architectureState.selectedAgentIds).toEqual(['agent1', 'agent2'])
    })

    it('should remove from selection with multi-select', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.selectAgent('agent1', false)
        result.current.selectAgent('agent2', true)
        result.current.selectAgent('agent1', true)
      })
      
      expect(result.current.architectureState.selectedAgentIds).toEqual(['agent2'])
    })

    it('should deselect single agent', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.selectAgent('agent1', false)
        result.current.selectAgent('agent2', true)
        result.current.deselectAgent('agent1')
      })
      
      expect(result.current.architectureState.selectedAgentIds).toEqual(['agent2'])
    })

    it('should clear all selections', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.selectAgent('agent1', false)
        result.current.selectAgent('agent2', true)
        result.current.clearSelection()
      })
      
      expect(result.current.architectureState.selectedAgentIds).toEqual([])
    })
  })

  describe('hover state', () => {
    it('should set hovered agent', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.setHoveredAgent('agent1')
      })
      
      expect(result.current.architectureState.hoveredAgentId).toBe('agent1')
    })

    it('should clear hovered agent', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.setHoveredAgent('agent1')
        result.current.setHoveredAgent(null)
      })
      
      expect(result.current.architectureState.hoveredAgentId).toBe(null)
    })
  })

  describe('viewport controls', () => {
    it('should set center point', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      const point: Point = { x: 100, y: 200 }
      
      act(() => {
        result.current.setCenterPoint(point)
      })
      
      expect(result.current.architectureState.centerPoint).toEqual(point)
    })

    it('should clear center point', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      const point: Point = { x: 100, y: 200 }
      
      act(() => {
        result.current.setCenterPoint(point)
        result.current.setCenterPoint(null)
      })
      
      expect(result.current.architectureState.centerPoint).toBe(null)
    })

    it('should set zoom level', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.setZoomLevel(1.5)
      })
      
      expect(result.current.architectureState.zoomLevel).toBe(1.5)
    })

    it('should clamp zoom level to minimum', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.setZoomLevel(0.01)
      })
      
      expect(result.current.architectureState.zoomLevel).toBe(0.1)
    })

    it('should clamp zoom level to maximum', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.setZoomLevel(10)
      })
      
      expect(result.current.architectureState.zoomLevel).toBe(5)
    })
  })

  describe('space collapse', () => {
    it('should collapse space', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.toggleSpaceCollapse('space1')
      })
      
      expect(result.current.architectureState.config.collapsedSpaces).toEqual(['space1'])
    })

    it('should expand collapsed space', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.toggleSpaceCollapse('space1')
        result.current.toggleSpaceCollapse('space1')
      })
      
      expect(result.current.architectureState.config.collapsedSpaces).toEqual([])
    })

    it('should handle multiple spaces', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      act(() => {
        result.current.toggleSpaceCollapse('space1')
        result.current.toggleSpaceCollapse('space2')
        result.current.toggleSpaceCollapse('space3')
      })
      
      expect(result.current.architectureState.config.collapsedSpaces).toEqual(['space1', 'space2', 'space3'])
    })
  })

  describe('architecture state', () => {
    it('should include all state properties', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      const state = result.current.architectureState
      
      expect(state).toHaveProperty('viewMode')
      expect(state).toHaveProperty('config')
      expect(state).toHaveProperty('agentNodes')
      expect(state).toHaveProperty('allCollaborations')
      expect(state).toHaveProperty('selectedAgentIds')
      expect(state).toHaveProperty('hoveredAgentId')
      expect(state).toHaveProperty('zoomLevel')
      expect(state).toHaveProperty('centerPoint')
    })

    it('should update when state changes', () => {
      const { result } = renderHook(() => useArchitectureViewMode())
      
      expect(result.current.architectureState.viewMode).toBe('default')
      
      act(() => {
        result.current.switchToArchitecture()
      })
      
      expect(result.current.architectureState.viewMode).toBe('architecture')
    })
  })
})

import React from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  PanOnScrollMode,
  ReactFlow,
  SelectionMode,
  useStore,
  useStoreApi,
  type Edge,
  type Node,
} from '@xyflow/react'
import { LABEL_COLORS, type LabelColor } from '@shared/types/labelColor'
import type { TerminalNodeData } from '../../types'
import type { WorkspaceCanvasViewProps } from './WorkspaceCanvasView.types'
import type { CanvasViewMode } from './architecture/types'
import { MAX_CANVAS_ZOOM, MIN_CANVAS_ZOOM } from './constants'
import { useWorkspaceCanvasGlobalDismissals } from './hooks/useGlobalDismissals'
import { useWorkspaceCanvasSpaceMenuState } from './hooks/useCanvasSpaceMenuState'
import { WorkspaceCanvasWindows } from './view/WorkspaceCanvasWindows'
import { WorkspaceContextMenu } from './view/WorkspaceContextMenu'
import { WorkspaceMinimapDock } from './view/WorkspaceMinimapDock'
import { WorkspaceSelectionDraftOverlay } from './view/WorkspaceSelectionDraftOverlay'
import { WorkspaceSnapGuidesOverlay } from './view/WorkspaceSnapGuidesOverlay'
import { WorkspaceCanvasTopOverlays } from './view/WorkspaceCanvasTopOverlays'
import { WorkspaceSpaceActionMenu } from './view/WorkspaceSpaceActionMenu'
import { WorkspaceSpaceRegionsOverlay } from './view/WorkspaceSpaceRegionsOverlay'
import { ArchitectureViewContainer } from './ArchitectureViewContainer'
import { isEditableDomTarget } from './domTargets'
import { selectDragSurfaceSelectionMode } from '../terminalNode/reactFlowState'

const WHEEL_BLOCK_SELECTOR = '.cove-window, .cove-window-backdrop, .workspace-context-menu'

type NodeWithEffectiveLabelColor = Node<TerminalNodeData> & {
  data: TerminalNodeData & { effectiveLabelColor?: LabelColor | null }
}

export function WorkspaceCanvasView({
  canvasRef,
  resolvedCanvasInputMode,
  onCanvasClick,
  handleCanvasPointerDownCapture,
  handleCanvasPointerMoveCapture,
  handleCanvasPointerUpCapture,
  handleCanvasDoubleClickCapture,
  handleCanvasWheelCapture,
  handleCanvasPaste,
  handleCanvasDragOver,
  handleCanvasDrop,
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onPaneClick,
  onPaneContextMenu,
  onNodeClick,
  onNodeContextMenu,
  onSelectionContextMenu,
  onSelectionChange,
  onNodeDragStart,
  onSelectionDragStart,
  onNodeDragStop,
  onSelectionDragStop,
  onMoveEnd,
  viewport,
  isTrackpadCanvasMode,
  useManualCanvasWheelGestures,
  isShiftPressed,
  selectionDraft,
  snapGuides,
  spaceVisuals,
  spaceFramePreview,
  selectedSpaceIds,
  handleSpaceDragHandlePointerDown,
  editingSpaceId,
  spaceRenameInputRef,
  spaceRenameDraft,
  setSpaceRenameDraft,
  commitSpaceRename,
  cancelSpaceRename,
  startSpaceRename,
  setSpaceLabelColor,
  selectedNodeCount,
  isMinimapVisible,
  minimapNodeColor,
  setIsMinimapVisible,
  onMinimapVisibilityChange,
  spaces,
  activateSpace,
  activateAllSpaces,
  contextMenu,
  closeContextMenu,
  magneticSnappingEnabled,
  onToggleMagneticSnapping,
  createTerminalNode,
  createNoteNodeFromContextMenu,
  arrangeAll,
  arrangeCanvas,
  arrangeInSpace,
  openTaskCreator,
  openAgentLauncher,
  openAgentLauncherForProvider,
  createSpaceFromSelectedNodes,
  clearNodeSelection,
  canConvertSelectedNoteToTask,
  isConvertSelectedNoteToTaskDisabled,
  convertSelectedNoteToTask,
  setSelectedNodeLabelColorOverride,
  taskCreator,
  taskTitleProviderLabel,
  taskTitleModelLabel,
  taskTagOptions,
  setTaskCreator,
  closeTaskCreator,
  generateTaskTitle,
  createTask,
  taskEditor,
  setTaskEditor,
  closeTaskEditor,
  generateTaskEditorTitle,
  saveTaskEdits,
  nodeDeleteConfirmation,
  setNodeDeleteConfirmation,
  confirmNodeDelete,
  spaceWorktreeMismatchDropWarning,
  cancelSpaceWorktreeMismatchDropWarning,
  continueSpaceWorktreeMismatchDropWarning,
  agentSettings,
  workspacePath,
  spaceActionMenu,
  availablePathOpeners,
  openSpaceActionMenu,
  closeSpaceActionMenu,
  copySpacePath,
  openSpacePath,
  spaceWorktreeDialog,
  worktreesRoot,
  openSpaceCreateWorktree,
  openSpaceArchive,
  closeSpaceWorktree,
  onShowMessage,
  onAppendSpaceArchiveRecord,
  updateSpaceDirectory,
  getSpaceBlockingNodes,
  closeNodesById,
  // Architecture View props
  viewMode: propViewMode = 'default',
  architectureConfig,
  apiClient,
  useArchitectureMockData = true,
  onViewModeChange,
  onArchitectureConfigChange,
}: WorkspaceCanvasViewProps): React.JSX.Element {
  const reactFlowStore = useStoreApi()
  const isDragSurfaceSelectionMode = useStore(selectDragSurfaceSelectionMode)
  const [labelColorFilter, setLabelColorFilter] = React.useState<LabelColor | null>(null)
  // Ensure viewMode is treated as CanvasViewMode, not literal 'default'
  const viewMode = (propViewMode ?? 'default') as CanvasViewMode

  useWorkspaceCanvasGlobalDismissals({
    contextMenu,
    spaceActionMenu,
    closeContextMenu,
    canvasRef,
    selectedNodeCount,
    clearNodeSelection,
  })

  const inheritedLabelColorByNodeId = React.useMemo(() => {
    const map = new Map<string, LabelColor>()

    for (const space of spaces) {
      if (!space.labelColor) {
        continue
      }

      for (const nodeId of space.nodeIds) {
        if (!map.has(nodeId)) {
          map.set(nodeId, space.labelColor)
        }
      }
    }

    return map
  }, [spaces])

  const nodesWithEffectiveLabelColor = React.useMemo<NodeWithEffectiveLabelColor[]>(() => {
    return nodes.map(node => {
      const override = node.data.labelColorOverride ?? null
      const effectiveLabelColor: LabelColor | null =
        override === 'none'
          ? null
          : override
            ? override
            : (inheritedLabelColorByNodeId.get(node.id) ?? null)

      return {
        ...node,
        data: {
          ...node.data,
          effectiveLabelColor,
        },
      }
    })
  }, [inheritedLabelColorByNodeId, nodes])

  const usedLabelColors = React.useMemo(() => {
    const seen = new Set<LabelColor>()
    for (const node of nodesWithEffectiveLabelColor) {
      const color = node.data.effectiveLabelColor ?? null
      if (color) {
        seen.add(color)
      }
    }

    return LABEL_COLORS.filter(color => seen.has(color))
  }, [nodesWithEffectiveLabelColor])

  React.useEffect(() => {
    if (!labelColorFilter) {
      return
    }

    if (!usedLabelColors.includes(labelColorFilter)) {
      setLabelColorFilter(null)
    }
  }, [labelColorFilter, usedLabelColors])

  const filteredNodes = React.useMemo(() => {
    if (!labelColorFilter) {
      return nodesWithEffectiveLabelColor
    }

    return nodesWithEffectiveLabelColor.map(node => {
      const effectiveLabelColor = node.data.effectiveLabelColor ?? null
      if (effectiveLabelColor === labelColorFilter) {
        return node
      }

      const className =
        typeof node.className === 'string' && node.className.trim().length > 0
          ? `${node.className} cove-node--filtered-out`
          : 'cove-node--filtered-out'

      return {
        ...node,
        className,
        style: {
          ...node.style,
          pointerEvents: 'none' as const,
        },
        draggable: false,
        selectable: false,
        focusable: false,
      }
    })
  }, [labelColorFilter, nodesWithEffectiveLabelColor])

  const filteredEdges = React.useMemo(() => {
    if (!labelColorFilter) {
      return edges
    }

    const allowedNodeIds = new Set(
      nodesWithEffectiveLabelColor
        .filter(node => (node.data.effectiveLabelColor ?? null) === labelColorFilter)
        .map(node => node.id),
    )

    return edges.filter(edge => allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target))
  }, [edges, labelColorFilter, nodesWithEffectiveLabelColor])

  const {
    activeMenuSpace,
    isActiveMenuSpaceOnWorkspaceRoot,
    canArrangeCanvas,
    canArrangeAll,
    canArrangeActiveSpace,
  } = useWorkspaceCanvasSpaceMenuState({
    spaceActionMenu,
    spaces,
    workspacePath,
    nodes,
  })

  // 渲染架构视图
  if (viewMode === 'architecture') {
    return (
      <ArchitectureViewContainer
        apiClient={apiClient}
        useMockData={useArchitectureMockData}
        initialConfig={architectureConfig}
        onViewModeChange={onViewModeChange}
        onSelectionChange={() => {}}
        onConfigChange={onArchitectureConfigChange}
      />
    )
  }

  // At this point, TypeScript knows viewMode is 'default'
  // We don't need to compare again in the JSX below

  // 渲染默认画布视图
  return (
    <div
      ref={canvasRef}
      className="workspace-canvas"
      data-canvas-input-mode={resolvedCanvasInputMode}
      data-selected-node-count={selectedNodeCount}
      data-cove-drag-surface-selection-mode={isDragSurfaceSelectionMode ? 'true' : 'false'}
      data-view-mode={viewMode}
      tabIndex={-1}
      onClick={onCanvasClick}
      onPaste={handleCanvasPaste}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      onDoubleClickCapture={handleCanvasDoubleClickCapture}
      onPointerDownCapture={event => {
        if (event.button === 0 && !isEditableDomTarget(event.target)) {
          canvasRef.current?.focus?.({ preventScroll: true })
        }

        if (
          event.button === 0 &&
          (contextMenu !== null || spaceActionMenu !== null) &&
          event.target instanceof Element &&
          !event.target.closest('.workspace-context-menu')
        ) {
          closeContextMenu()
        }

        handleCanvasPointerDownCapture(event)
      }}
      onPointerMoveCapture={handleCanvasPointerMoveCapture}
      onPointerUpCapture={handleCanvasPointerUpCapture}
      onWheelCapture={event => {
        if (event.target instanceof Element && event.target.closest(WHEEL_BLOCK_SELECTOR)) {
          return
        }
        handleCanvasWheelCapture(event.nativeEvent)
      }}
    >
      {/* 视图切换工具栏 */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 1000,
          backgroundColor: 'var(--cove-surface-1)',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <button
          type="button"
          data-testid="default-view-button"
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#ffffff',
            backgroundColor: 'var(--cove-primary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => onViewModeChange?.('default')}
          title="默认视图"
        >
          默认视图
        </button>
        <button
          type="button"
          data-testid="architecture-view-button"
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            color: 'var(--cove-text-1)',
            backgroundColor: 'var(--cove-surface-2)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => onViewModeChange?.('architecture')}
          title="架构视图"
        >
          架构视图
        </button>
        <button
          type="button"
          data-testid="view-mode-toggle"
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            color: 'var(--cove-text-1)',
            backgroundColor: 'var(--cove-surface-2)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => onViewModeChange?.('architecture')}
          title="切换视图模式"
        >
          切换视图
        </button>
      </div>

      <ReactFlow<Node<TerminalNodeData>, Edge>
        nodes={filteredNodes}
        edges={filteredEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onSelectionContextMenu={onSelectionContextMenu}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={onNodeDragStart}
        onSelectionDragStart={onSelectionDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStop={onSelectionDragStop}
        onMoveStart={() => {
          reactFlowStore.setState({
            coveViewportInteractionActive: true,
          } as unknown as Parameters<typeof reactFlowStore.setState>[0])
        }}
        onMoveEnd={(event, nextViewport) => {
          reactFlowStore.setState({
            coveViewportInteractionActive: false,
          } as unknown as Parameters<typeof reactFlowStore.setState>[0])
          onMoveEnd(event, nextViewport)
        }}
        selectionMode={SelectionMode.Partial}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        selectionOnDrag={isTrackpadCanvasMode || isShiftPressed}
        nodesDraggable
        elementsSelectable
        panOnDrag={isTrackpadCanvasMode ? false : !isShiftPressed}
        zoomOnScroll={!useManualCanvasWheelGestures}
        panOnScroll={false}
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnPinch={!useManualCanvasWheelGestures}
        zoomOnDoubleClick={false}
        defaultViewport={viewport}
        minZoom={MIN_CANVAS_ZOOM}
        maxZoom={MAX_CANVAS_ZOOM}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          size={1}
          gap={24}
          color="var(--cove-canvas-dot)"
        />
        <WorkspaceSpaceRegionsOverlay
          workspacePath={workspacePath}
          spaceVisuals={spaceVisuals}
          spaceFramePreview={spaceFramePreview}
          selectedSpaceIds={selectedSpaceIds}
          handleSpaceDragHandlePointerDown={handleSpaceDragHandlePointerDown}
          editingSpaceId={editingSpaceId}
          spaceRenameInputRef={spaceRenameInputRef}
          spaceRenameDraft={spaceRenameDraft}
          setSpaceRenameDraft={setSpaceRenameDraft}
          commitSpaceRename={commitSpaceRename}
          cancelSpaceRename={cancelSpaceRename}
          startSpaceRename={startSpaceRename}
          onOpenSpaceMenu={openSpaceActionMenu}
        />

        <WorkspaceMinimapDock
          isMinimapVisible={isMinimapVisible}
          minimapNodeColor={minimapNodeColor}
          setIsMinimapVisible={setIsMinimapVisible}
          onMinimapVisibilityChange={onMinimapVisibilityChange}
        />

        <Controls className="workspace-canvas__controls" showInteractive={false} />
      </ReactFlow>

      <WorkspaceSnapGuidesOverlay guides={snapGuides} />
      <WorkspaceSelectionDraftOverlay canvasRef={canvasRef} draft={selectionDraft} />

      <WorkspaceCanvasTopOverlays
        spaces={spaces}
        activateSpace={activateSpace}
        activateAllSpaces={activateAllSpaces}
        cancelSpaceRename={cancelSpaceRename}
        usedLabelColors={usedLabelColors}
        activeLabelColorFilter={labelColorFilter}
        onToggleLabelColorFilter={color => {
          closeContextMenu()
          closeSpaceActionMenu()
          clearNodeSelection()
          setLabelColorFilter(previous => (previous === color ? null : color))
        }}
        selectedNodeCount={selectedNodeCount}
      />

      <WorkspaceContextMenu
        contextMenu={contextMenu}
        closeContextMenu={closeContextMenu}
        createTerminalNode={createTerminalNode}
        createNoteNodeFromContextMenu={createNoteNodeFromContextMenu}
        openTaskCreator={openTaskCreator}
        openAgentLauncher={openAgentLauncher}
        agentProviderOrder={agentSettings.agentProviderOrder}
        openAgentLauncherForProvider={openAgentLauncherForProvider}
        spaces={spaces}
        magneticSnappingEnabled={magneticSnappingEnabled}
        onToggleMagneticSnapping={onToggleMagneticSnapping}
        canArrangeAll={canArrangeAll}
        canArrangeCanvas={canArrangeCanvas}
        arrangeAll={arrangeAll}
        arrangeCanvas={arrangeCanvas}
        arrangeInSpace={arrangeInSpace}
        createSpaceFromSelectedNodes={createSpaceFromSelectedNodes}
        clearNodeSelection={clearNodeSelection}
        canConvertSelectedNoteToTask={canConvertSelectedNoteToTask}
        isConvertSelectedNoteToTaskDisabled={isConvertSelectedNoteToTaskDisabled}
        convertSelectedNoteToTask={convertSelectedNoteToTask}
        setSelectedNodeLabelColorOverride={setSelectedNodeLabelColorOverride}
      />

      <WorkspaceSpaceActionMenu
        menu={spaceActionMenu}
        availableOpeners={availablePathOpeners}
        canArrange={canArrangeActiveSpace}
        canCreateWorktree={activeMenuSpace !== null && isActiveMenuSpaceOnWorkspaceRoot}
        canArchive={activeMenuSpace !== null}
        closeMenu={closeSpaceActionMenu}
        setSpaceLabelColor={setSpaceLabelColor}
        onArrange={arrangeInSpace}
        onCreateWorktree={() => {
          if (activeMenuSpace) {
            openSpaceCreateWorktree(activeMenuSpace.id)
          }
        }}
        onArchive={() => {
          if (activeMenuSpace) {
            openSpaceArchive(activeMenuSpace.id)
          }
        }}
        onCopyPath={() => {
          if (activeMenuSpace) {
            return copySpacePath(activeMenuSpace.id)
          }
        }}
        onOpenPath={openerId => {
          if (activeMenuSpace) {
            return openSpacePath(activeMenuSpace.id, openerId)
          }
        }}
      />

      <WorkspaceCanvasWindows
        taskCreator={taskCreator}
        taskTitleProviderLabel={taskTitleProviderLabel}
        taskTitleModelLabel={taskTitleModelLabel}
        taskTagOptions={taskTagOptions}
        setTaskCreator={setTaskCreator}
        closeTaskCreator={closeTaskCreator}
        generateTaskTitle={generateTaskTitle}
        createTask={createTask}
        taskEditor={taskEditor}
        setTaskEditor={setTaskEditor}
        closeTaskEditor={closeTaskEditor}
        generateTaskEditorTitle={generateTaskEditorTitle}
        saveTaskEdits={saveTaskEdits}
        nodeDeleteConfirmation={nodeDeleteConfirmation}
        setNodeDeleteConfirmation={setNodeDeleteConfirmation}
        confirmNodeDelete={confirmNodeDelete}
        spaceWorktreeMismatchDropWarning={spaceWorktreeMismatchDropWarning}
        cancelSpaceWorktreeMismatchDropWarning={cancelSpaceWorktreeMismatchDropWarning}
        continueSpaceWorktreeMismatchDropWarning={continueSpaceWorktreeMismatchDropWarning}
        spaceWorktreeDialog={spaceWorktreeDialog}
        spaces={spaces}
        nodes={nodes}
        workspacePath={workspacePath}
        worktreesRoot={worktreesRoot}
        agentSettings={agentSettings}
        closeSpaceWorktree={closeSpaceWorktree}
        onShowMessage={onShowMessage}
        onAppendSpaceArchiveRecord={onAppendSpaceArchiveRecord}
        updateSpaceDirectory={updateSpaceDirectory}
        getSpaceBlockingNodes={getSpaceBlockingNodes}
        closeNodesById={closeNodesById}
      />
    </div>
  )
}

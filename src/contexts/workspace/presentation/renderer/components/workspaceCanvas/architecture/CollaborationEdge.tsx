/**
 * 协作关系连线组件
 * 
 * 在架构视图中渲染 Agent 之间的协作关系连线。
 * 
 * @packageDocumentation
 */

import React, { useMemo } from 'react'
import type { CollaborationLink, ArchitectureAgentNode } from './types'
import {
  getCollaborationColor,
  getCollaborationLabel,
  getCollaborationStrokeStyle,
} from './types'

/**
 * 协作关系连线组件属性
 */
export interface CollaborationEdgeProps {
  /** 源节点 */
  sourceNode: ArchitectureAgentNode
  /** 目标节点 */
  targetNode: ArchitectureAgentNode
  /** 协作关系 */
  link: CollaborationLink
  /** 是否高亮显示 */
  isHighlighted: boolean
  /** 悬停处理函数 */
  onMouseEnter?: (link: CollaborationLink) => void
  /** 悬停离开处理函数 */
  onMouseLeave?: () => void
}

/**
 * 协作关系连线组件
 * 
 * 使用 SVG 渲染两个 Agent 节点之间的连线。
 */
export function CollaborationEdge({
  sourceNode,
  targetNode,
  link,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
}: CollaborationEdgeProps): React.JSX.Element {
  // 计算连线起点和终点 (节点中心)
  const startX = sourceNode.position.x + sourceNode.width / 2
  const startY = sourceNode.position.y + sourceNode.height / 2
  const endX = targetNode.position.x + targetNode.width / 2
  const endY = targetNode.position.y + targetNode.height / 2

  // 计算控制点 (用于贝塞尔曲线)
  const deltaX = endX - startX
  const deltaY = endY - startY
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  // 控制点偏移量 (基于距离)
  const controlOffset = Math.min(distance * 0.3, 100)
  
  // 计算控制点 (使曲线更自然)
  const control1X = startX + deltaX * 0.5
  const control1Y = startY - controlOffset * 0.5
  const control2X = endX - deltaX * 0.5
  const control2Y = endY + controlOffset * 0.5

  const pathData = `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`

  const strokeColor = getCollaborationColor(link.type)
  const strokeStyle = getCollaborationStrokeStyle(link.type)
  const strokeWidth = isHighlighted ? strokeStyle.strokeWidth + 1 : strokeStyle.strokeWidth
  const opacity = isHighlighted ? 1 : link.strength * 0.7 + 0.3

  const handleMouseEnter = () => {
    onMouseEnter?.(link)
  }

  const handleMouseLeave = () => {
    onMouseLeave?.()
  }

  return (
    <g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* 连线 */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeStyle.strokeDasharray}
        opacity={opacity}
        style={{
          transition: 'all 0.2s ease',
          filter: isHighlighted ? `drop-shadow(0 0 4px ${strokeColor})` : 'none',
        }}
      />
      
      {/* 箭头 */}
      <ArrowMarker
        startX={control2X}
        startY={control2Y}
        endX={endX}
        endY={endY}
        color={strokeColor}
        isHighlighted={isHighlighted}
      />

      {/* 关系标签 (仅在高亮时显示) */}
      {isHighlighted && (
        <g>
          <rect
            x={(startX + endX) / 2 - 20}
            y={(startY + endY) / 2 - 10}
            width="40"
            height="20"
            fill="#1f2937"
            stroke={strokeColor}
            strokeWidth="1"
            rx="4"
            opacity="0.9"
          />
          <text
            x={(startX + endX) / 2}
            y={(startY + endY) / 2 + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="10"
            fontWeight="500"
          >
            {getCollaborationLabel(link.type)}
          </text>
        </g>
      )}
    </g>
  )
}

/**
 * 箭头标记组件
 */
function ArrowMarker({
  startX,
  startY,
  endX,
  endY,
  color,
  isHighlighted,
}: {
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  isHighlighted: boolean
}): React.JSX.Element {
  // 计算箭头方向
  const angle = Math.atan2(endY - startY, endX - startX)
  const arrowSize = isHighlighted ? 10 : 8
  
  // 箭头尖端位置 (距离终点一点距离)
  const tipDistance = arrowSize + 2
  const tipX = endX - Math.cos(angle) * tipDistance
  const tipY = endY - Math.sin(angle) * tipDistance
  
  // 箭头三个点
  const arrowPoints = [
    { x: tipX, y: tipY }, // 尖端
    { 
      x: tipX - Math.cos(angle - Math.PI / 6) * arrowSize, 
      y: tipY - Math.sin(angle - Math.PI / 6) * arrowSize 
    }, // 左下
    { 
      x: tipX - Math.cos(angle + Math.PI / 6) * arrowSize, 
      y: tipY - Math.sin(angle + Math.PI / 6) * arrowSize 
    }, // 右下
  ]

  const pathData = `M ${arrowPoints[0].x} ${arrowPoints[0].y} L ${arrowPoints[1].x} ${arrowPoints[1].y} L ${arrowPoints[2].x} ${arrowPoints[2].y} Z`

  return (
    <path
      d={pathData}
      fill={color}
      opacity={isHighlighted ? 1 : 0.8}
      style={{
        transition: 'all 0.2s ease',
        filter: isHighlighted ? `drop-shadow(0 0 4px ${color})` : 'none',
      }}
    />
  )
}

/**
 * 协作关系连线集合组件
 * 
 * 渲染所有协作关系连线。
 */
export interface CollaborationEdgesProps {
  /** Agent 节点列表 */
  nodes: ArchitectureAgentNode[]
  /** 所有协作关系 */
  collaborations: CollaborationLink[]
  /** 高亮的关系 ID 列表 */
  highlightedLinkIds: string[]
  /** 悬停的关系 ID */
  hoveredLinkId: string | null
  /** 关系悬停进入处理函数 */
  onLinkHover?: (link: CollaborationLink) => void
  /** 关系悬停离开处理函数 */
  onLinkHoverEnd?: () => void
}

/**
 * 协作关系连线集合组件
 */
export function CollaborationEdges({
  nodes,
  collaborations,
  highlightedLinkIds,
  hoveredLinkId,
  onLinkHover,
  onLinkHoverEnd,
}: CollaborationEdgesProps): React.JSX.Element {
  // 创建节点查找映射
  const nodeMap = useMemo(
    () => new Map(nodes.map(node => [node.id, node])),
    [nodes]
  )

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <g style={{ pointerEvents: 'auto' }}>
        {collaborations.map((link, index) => {
          const sourceNode = nodeMap.get(link.fromAgentId)
          const targetNode = nodeMap.get(link.toAgentId)

          if (!sourceNode || !targetNode) {
            return null
          }

          const linkId = `${link.fromAgentId}-${link.toAgentId}-${index}`
          const isHighlighted = highlightedLinkIds.includes(linkId) || hoveredLinkId === linkId

          return (
            <CollaborationEdge
              key={linkId}
              sourceNode={sourceNode}
              targetNode={targetNode}
              link={link}
              isHighlighted={isHighlighted}
              onMouseEnter={onLinkHover}
              onMouseLeave={onLinkHoverEnd}
            />
          )
        })}
      </g>
    </svg>
  )
}

export default CollaborationEdge

/**
 * Architecture View E2E Tests
 *
 * 测试架构视图的关键路径：
 * - 视图切换：启动应用 → 切换架构视图 → 验证渲染
 * - 节点渲染：显示五部门 Agent 节点
 * - 节点交互：点击、双击、悬停
 * - 连线显示：协作关系贝塞尔曲线 + 箭头
 */

import { test, expect, type Page } from '@playwright/test'
import { launchApp, clearAndSeedWorkspace, type SeedNode } from './workspace-canvas.helpers'

/**
 * 创建测试用的 Agent 节点数据
 */
function createTestAgentNodes(): SeedNode[] {
  return [
    {
      id: 'agent-zhongshu-001',
      title: '中书省 · 架构设计',
      kind: 'agent',
      position: { x: 100, y: 100 },
      width: 280,
      height: 120,
      status: 'running',
      agent: {
        provider: 'claude-code',
        prompt: '负责系统架构设计',
        model: 'claude-sonnet-4-5-20250929',
        effectiveModel: 'claude-sonnet-4-5-20250929',
        launchMode: 'new',
        resumeSessionId: null,
        executionDirectory: 'workspace',
        customDirectory: null,
        shouldCreateDirectory: false,
        directoryMode: 'workspace',
      },
    },
    {
      id: 'agent-menxia-001',
      title: '门下省 · 代码审查',
      kind: 'agent',
      position: { x: 450, y: 100 },
      width: 280,
      height: 120,
      status: 'running',
      agent: {
        provider: 'gemini',
        prompt: '负责代码审查和质量把关',
        model: 'gemini-2.5-pro',
        effectiveModel: 'gemini-2.5-pro',
        launchMode: 'new',
        resumeSessionId: null,
        executionDirectory: 'workspace',
        customDirectory: null,
        shouldCreateDirectory: false,
        directoryMode: 'workspace',
      },
    },
    {
      id: 'agent-bingbu-001',
      title: '兵部 · 代码实现',
      kind: 'agent',
      position: { x: 100, y: 300 },
      width: 280,
      height: 120,
      status: 'running',
      agent: {
        provider: 'openclaw',
        prompt: '负责代码实现和单元测试',
        model: 'minimax-m2.7',
        effectiveModel: 'minimax-m2.7',
        launchMode: 'new',
        resumeSessionId: null,
        executionDirectory: 'workspace',
        customDirectory: null,
        shouldCreateDirectory: false,
        directoryMode: 'workspace',
      },
    },
    {
      id: 'agent-yushi-001',
      title: '御史台 · 独立测试',
      kind: 'agent',
      position: { x: 450, y: 300 },
      width: 280,
      height: 120,
      status: 'standby',
      agent: {
        provider: 'opencode',
        prompt: '负责独立测试和验证',
        model: 'gpt-4.1',
        effectiveModel: 'gpt-4.1',
        launchMode: 'new',
        resumeSessionId: null,
        executionDirectory: 'workspace',
        customDirectory: null,
        shouldCreateDirectory: false,
        directoryMode: 'workspace',
      },
    },
    {
      id: 'agent-xingbu-001',
      title: '刑部 · 安全审计',
      kind: 'agent',
      position: { x: 275, y: 500 },
      width: 280,
      height: 120,
      status: 'running',
      agent: {
        provider: 'codex',
        prompt: '负责安全审计和漏洞检测',
        model: 'o3-pro',
        effectiveModel: 'o3-pro',
        launchMode: 'new',
        resumeSessionId: null,
        executionDirectory: 'workspace',
        customDirectory: null,
        shouldCreateDirectory: false,
        directoryMode: 'workspace',
      },
    },
  ]
}

/**
 * 切换到架构视图模式
 */
async function switchToArchitectureView(window: Page): Promise<void> {
  // 查找视图切换按钮并点击
  const viewModeToggle = window.locator('[data-testid="view-mode-toggle"]')
  const architectureButton = window.locator('[data-testid="architecture-view-button"]')

  // 尝试多种方式切换到架构视图
  if (await viewModeToggle.isVisible()) {
    await viewModeToggle.click()
    await architectureButton.click()
  } else {
    // 备用方案：直接点击架构视图按钮
    await architectureButton.click()
  }

  // 等待架构视图渲染
  await window.waitForSelector('[data-testid="architecture-view"]', { timeout: 10000 })
}

test.describe('Architecture View E2E', () => {
  test('should launch application and switch to architecture view', async () => {
    const { electronApp, window } = await launchApp()

    try {
      // 等待应用加载完成
      await window.waitForLoadState('domcontentloaded')

      // 验证应用已启动
      const title = await window.title()
      expect(title).toBeDefined()
      expect(title.length).toBeGreaterThan(0)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 验证架构视图已渲染
      const architectureView = window.locator('[data-testid="architecture-view"]')
      await expect(architectureView).toBeVisible()
    } finally {
      await electronApp.close()
    }
  })

  test('should render five department agent nodes', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建并注入测试节点
      const testNodes = createTestAgentNodes()
      await clearAndSeedWorkspace(window, testNodes)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 验证所有部门节点都显示
      const zhongshuNode = window.locator('[data-testid="node-agent-zhongshu-001"]')
      const menxiaNode = window.locator('[data-testid="node-agent-menxia-001"]')
      const bingbuNode = window.locator('[data-testid="node-agent-bingbu-001"]')
      const yushiNode = window.locator('[data-testid="node-agent-yushi-001"]')
      const xingbuNode = window.locator('[data-testid="node-agent-xingbu-001"]')

      await expect(zhongshuNode).toBeVisible()
      await expect(menxiaNode).toBeVisible()
      await expect(bingbuNode).toBeVisible()
      await expect(yushiNode).toBeVisible()
      await expect(xingbuNode).toBeVisible()

      // 验证节点标题
      await expect(zhongshuNode).toContainText('中书省')
      await expect(menxiaNode).toContainText('门下省')
      await expect(bingbuNode).toContainText('兵部')
      await expect(yushiNode).toContainText('御史台')
      await expect(xingbuNode).toContainText('刑部')
    } finally {
      await electronApp.close()
    }
  })

  test('should display collaboration links between nodes', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建测试节点
      const testNodes = createTestAgentNodes()
      await clearAndSeedWorkspace(window, testNodes)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 验证协作连线存在 (SVG 路径)
      const collaborationPaths = window.locator('svg path[data-testid^="collaboration-link"]')
      const collaborationCount = await collaborationPaths.count()

      // 至少应该有 4 条连线 (中书→门下，门下→兵部，兵部内部等)
      expect(collaborationCount).toBeGreaterThanOrEqual(4)

      // 验证连线有箭头标记
      const arrowMarkers = window.locator('svg marker[id^="arrowhead"]')
      const arrowCount = await arrowMarkers.count()
      expect(arrowCount).toBeGreaterThan(0)
    } finally {
      await electronApp.close()
    }
  })

  test('should handle node click interaction', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建测试节点
      const testNodes = createTestAgentNodes()
      await clearAndSeedWorkspace(window, testNodes)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 点击兵部节点
      const bingbuNode = window.locator('[data-testid="node-agent-bingbu-001"]')
      await bingbuNode.click()

      // 验证节点被选中 (应该有选中状态样式)
      await expect(bingbuNode).toHaveClass(/selected|active/)

      // 或者验证选中面板显示
      const selectionPanel = window.locator('[data-testid="selection-panel"]')
      await expect(selectionPanel).toBeVisible()
    } finally {
      await electronApp.close()
    }
  })

  test('should handle node double-click interaction', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建测试节点
      const testNodes = createTestAgentNodes()
      await clearAndSeedWorkspace(window, testNodes)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 双击中书省节点
      const zhongshuNode = window.locator('[data-testid="node-agent-zhongshu-001"]')
      await zhongshuNode.dblclick()

      // 验证打开详情面板或编辑器
      const detailPanel = window.locator('[data-testid="detail-panel"]')
      await expect(detailPanel).toBeVisible()
    } finally {
      await electronApp.close()
    }
  })

  test('should handle node hover interaction', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建测试节点
      const testNodes = createTestAgentNodes()
      await clearAndSeedWorkspace(window, testNodes)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 悬停在门下省节点上
      const menxiaNode = window.locator('[data-testid="node-agent-menxia-001"]')
      await menxiaNode.hover()

      // 验证显示悬停提示或高亮相关连线
      const tooltip = window.locator('[data-testid="node-tooltip"]')
      const highlightedLinks = window.locator('svg path.highlighted')

      // 至少应该显示提示或高亮连线之一
      const tooltipVisible = await tooltip.isVisible()
      const linksHighlighted = (await highlightedLinks.count()) > 0
      expect(tooltipVisible || linksHighlighted).toBe(true)
    } finally {
      await electronApp.close()
    }
  })

  test('should display node status indicators', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建测试节点 (包含不同状态)
      const testNodes = createTestAgentNodes()
      await clearAndSeedWorkspace(window, testNodes)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 验证运行中节点显示绿色状态指示器
      const runningNode = window.locator('[data-testid="node-agent-zhongshu-001"]')
      const runningIndicator = runningNode.locator('[data-testid="status-indicator"]')
      await expect(runningIndicator).toBeVisible()

      // 验证待机节点显示黄色状态指示器
      const standbyNode = window.locator('[data-testid="node-agent-yushi-001"]')
      const standbyIndicator = standbyNode.locator('[data-testid="status-indicator"]')
      await expect(standbyIndicator).toBeVisible()
    } finally {
      await electronApp.close()
    }
  })

  test('should render bezier curves for collaboration links', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建测试节点
      const testNodes = createTestAgentNodes()
      await clearAndSeedWorkspace(window, testNodes)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 获取所有连线路径
      const collaborationPaths = window.locator('svg path[data-testid^="collaboration-link"]')
      const count = await collaborationPaths.count()

      expect(count).toBeGreaterThan(0)

      // 验证路径使用贝塞尔曲线 (应该包含 C 或 Q 指令)
      const firstPath = collaborationPaths.first()
      const pathData = await firstPath.getAttribute('d')
      expect(pathData).toBeTruthy()

      // 贝塞尔曲线应该包含 C (三次) 或 Q (二次) 指令
      const hasBezier =
        pathData?.includes('C') ||
        pathData?.includes('Q') ||
        pathData?.includes('c') ||
        pathData?.includes('q')
      expect(hasBezier).toBe(true)
    } finally {
      await electronApp.close()
    }
  })

  test('should switch back to default view', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建测试节点
      const testNodes = createTestAgentNodes()
      await clearAndSeedWorkspace(window, testNodes)

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 验证架构视图显示
      const architectureView = window.locator('[data-testid="architecture-view"]')
      await expect(architectureView).toBeVisible()

      // 切换回默认视图
      const viewModeToggle = window.locator('[data-testid="view-mode-toggle"]')
      await viewModeToggle.click()

      const defaultButton = window.locator('[data-testid="default-view-button"]')
      await defaultButton.click()

      // 验证默认视图显示
      const defaultView = window.locator('[data-testid="default-view"]')
      await expect(defaultView).toBeVisible()

      // 验证架构视图隐藏
      await expect(architectureView).not.toBeVisible()
    } finally {
      await electronApp.close()
    }
  })

  test('should handle empty state gracefully', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await window.waitForLoadState('domcontentloaded')

      // 创建空的工作区
      await clearAndSeedWorkspace(window, [])

      // 切换到架构视图
      await switchToArchitectureView(window)

      // 验证显示空状态提示
      const emptyState = window.locator('[data-testid="architecture-empty-state"]')
      await expect(emptyState).toBeVisible()

      // 或者验证画布区域存在但没有节点
      const canvas = window.locator('[data-testid="architecture-view"]')
      await expect(canvas).toBeVisible()

      const nodes = canvas.locator('[data-testid^="node-"]')
      const nodeCount = await nodes.count()
      expect(nodeCount).toBe(0)
    } finally {
      await electronApp.close()
    }
  })
})

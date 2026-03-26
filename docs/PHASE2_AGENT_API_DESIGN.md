# Agent API 客户端设计方案

**文档类型**: 设计方案 (Spec)  
**创建时间**: 2026-03-26  
**任务**: Phase 2 - 任务 1  
**状态**: 待审批

---

## 1. 需求理解

### 1.1 背景
OpenCove Canvas 是一个 Electron 工作区应用，需要与 OpenClaw 框架的 Agent 系统进行交互。Phase 2 要求实现一个 Agent API 客户端，支持：
- OAuth 2.0 认证
- Agent 调用接口
- 单元测试覆盖

### 1.2 核心需求
1. **认证**: 安全的 OAuth 2.0 认证流程
2. **Agent 调用**: 能够调用 OpenClaw 管理的 Agent
3. **状态管理**: 获取 Agent 运行状态
4. **类型安全**: TypeScript 类型定义完整
5. **可测试**: 支持单元测试和模拟

### 1.3 约束条件
- 类型注解覆盖率 ≥95%
- 文档字符串覆盖率 ≥90%
- 测试覆盖率 ≥80%
- 遵循 OpenCove 架构规范 (DDD + Clean Architecture)

---

## 2. 实现方案

### 方案 A: HTTP REST API 客户端

#### 架构
```
┌─────────────────┐     HTTPS/OAuth2     ┌─────────────────┐
│  OpenCove Canvas│ ◄──────────────────► │  OpenClaw Gateway│
│  AgentApiClient │                      │  (HTTP Server)   │
└─────────────────┘                      └─────────────────┘
```

#### 核心组件
```typescript
// src/contexts/agent/infrastructure/api/
├── OpenClawApiClient.ts       // 主客户端
├── OAuth2AuthProvider.ts      // 认证提供者
├── AgentApiTypes.ts           // API 类型定义
└── AgentApiEndpoints.ts       // 端点定义
```

#### 优点
- ✅ 标准协议，易于理解和维护
- ✅ 与 OpenClaw 解耦，可独立部署
- ✅ 支持跨平台、跨语言
- ✅ 易于测试和模拟

#### 缺点
- ❌ 需要 OpenClaw 暴露 HTTP API
- ❌ 网络延迟
- ❌ 需要处理网络错误和重试

#### 适用场景
- OpenClaw 已提供或计划提供 HTTP API
- 需要跨进程/跨机器通信
- 对延迟不敏感

---

### 方案 B: 本地 IPC/Unix Socket 桥接

#### 架构
```
┌─────────────────┐     IPC/Unix Socket    ┌─────────────────┐
│  OpenCove Canvas│ ◄──────────────────► │  OpenClaw Daemon │
│  AgentIpcClient │                      │  (Local Socket)  │
└─────────────────┘                      └─────────────────┘
```

#### 核心组件
```typescript
// src/contexts/agent/infrastructure/ipc/
├── OpenClawIpcClient.ts       // IPC 客户端
├── IpcMessageProtocol.ts      // 消息协议
├── IpcAuthToken.ts            // Token 认证
└── IpcTypes.ts                // IPC 类型定义
```

#### 优点
- ✅ 低延迟，无网络开销
- ✅ 更适合本地进程间通信
- ✅ 不依赖网络配置

#### 缺点
- ❌ 平台特定实现 (Windows named pipes vs Unix socket)
- ❌ 需要 OpenClaw daemon 运行
- ❌ 测试复杂度较高

#### 适用场景
- OpenCove 和 OpenClaw 运行在同一机器
- 对延迟敏感
- 不需要跨机器通信

---

### 方案 C: 共享事件总线/数据库

#### 架构
```
┌─────────────────┐                          ┌─────────────────┐
│  OpenCove Canvas│     SQLite/EventBus     │  OpenClaw       │
│  AgentBusClient │ ◄─────────────────────► │  (Event Producer)│
└─────────────────┘    共享存储/事件流       └─────────────────┘
```

#### 核心组件
```typescript
// src/contexts/agent/infrastructure/bus/
├── AgentEventBus.ts           // 事件总线
├── SharedStateStore.ts        // 共享状态存储
├── BusAuthToken.ts            // 文件 Token 认证
└── BusTypes.ts                // 事件类型定义
```

#### 优点
- ✅ 简单，无需网络或 IPC
- ✅ 支持离线操作
- ✅ 天然支持事件驱动架构

#### 缺点
- ❌ 潜在竞态条件
- ❌ 实时性较差
- ❌ 需要处理数据同步

#### 适用场景
- 对实时性要求不高
- 需要离线支持
- 事件驱动场景

---

## 3. 方案对比

| 维度 | 方案 A (HTTP) | 方案 B (IPC) | 方案 C (EventBus) |
|------|--------------|-------------|------------------|
| **延迟** | 中 | 低 | 中 |
| **复杂度** | 低 | 中 | 中 |
| **可测试性** | 高 | 中 | 中 |
| **跨平台** | 高 | 中 | 高 |
| **实时性** | 高 | 高 | 中 |
| **OpenClaw 依赖** | HTTP API | Daemon | 共享存储 |
| **推荐指数** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## 4. 推荐方案

### 首选：方案 A (HTTP REST API)

**理由**:
1. **标准协议**: OAuth 2.0 + REST 是行业标准，易于理解和维护
2. **解耦**: OpenCove 和 OpenClaw 可以独立演进
3. **可扩展**: 未来可支持远程 Agent 调用
4. **易测试**: HTTP 客户端易于 mock 和单元测试
5. **符合任务要求**: 任务明确提到 OAuth 2.0 认证

### 备选：方案 B (IPC)

如果 OpenClaw 不提供 HTTP API，可考虑 IPC 方案作为备选。

---

## 5. 技术设计 (方案 A)

### 5.1 认证流程 (OAuth 2.0)

```typescript
interface OAuth2Config {
  clientId: string
  clientSecret: string
  authorizationUrl: string
  tokenUrl: string
  redirectUri: string
  scopes: string[]
}

interface OAuth2Token {
  accessToken: string
  refreshToken: string
  expiresAt: number
  tokenType: 'Bearer'
}

class OAuth2AuthProvider {
  // 获取访问令牌
  getAccessToken(): Promise<string>
  
  // 刷新令牌
  refreshAccessToken(): Promise<void>
  
  // 撤销令牌
  revokeToken(): Promise<void>
}
```

### 5.2 API 客户端接口

```typescript
interface AgentApiClient {
  // Agent 管理
  listAgents(): Promise<AgentInfo[]>
  getAgentStatus(agentId: string): Promise<AgentStatus>
  invokeAgent(request: AgentInvokeRequest): Promise<AgentInvokeResponse>
  
  // 会话管理
  createSession(config: SessionConfig): Promise<SessionInfo>
  getSessionStatus(sessionId: string): Promise<SessionStatus>
  terminateSession(sessionId: string): Promise<void>
  
  // 认证
  authenticate(): Promise<void>
  logout(): Promise<void>
}
```

### 5.3 目录结构

```
src/contexts/agent/infrastructure/openclaw-api/
├── index.ts                     // 导出
├── OpenClawApiClient.ts         // 主客户端实现
├── OAuth2AuthProvider.ts        // OAuth 2.0 认证
├── AgentApiTypes.ts             // 类型定义
├── AgentApiConfig.ts            // 配置管理
└── errors.ts                    // 错误定义

tests/unit/contexts/agent/infrastructure/openclaw-api/
├── OpenClawApiClient.test.ts
├── OAuth2AuthProvider.test.ts
└── AgentApiTypes.test.ts
```

---

## 6. 实施计划

### Phase 1: 基础架构 (W8)
- [ ] 定义 API 类型和接口
- [ ] 实现 OAuth 2.0 认证提供者
- [ ] 实现 HTTP 客户端基础框架
- [ ] 编写单元测试

### Phase 2: 核心功能 (W8-9)
- [ ] 实现 Agent 调用接口
- [ ] 实现会话管理接口
- [ ] 错误处理和重试机制
- [ ] 集成测试

### Phase 3: 优化与文档 (W9)
- [ ] 性能优化
- [ ] 文档完善
- [ ] 代码审查

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| OpenClaw 无 HTTP API | 高 | 与中书省确认 API 规范，或采用 IPC 备选方案 |
| OAuth 2.0 流程复杂 | 中 | 使用成熟库 (如 simple-oauth2) |
| 网络不稳定 | 中 | 实现重试机制和离线降级 |
| 类型定义不一致 | 低 | 与 OpenClaw 共享类型定义或生成 |

---

## 8. 审批请求

请 @中书省 (zhongshu_architect) 和 @尚书省 (shangshu_coordinator) 审批：

1. **方案选择**: 是否同意采用方案 A (HTTP REST API)？
2. **API 规范**: OpenClaw 是否已有或计划提供 HTTP API？
3. **优先级**: 任务 1 和任务 2 的优先级如何？

---

*文档版本: v1.0*  
*创建者: 兵部 (bingbu_coder)*

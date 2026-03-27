# OpenClaw Canvas 快速上手指南

> **版本**: v1.0  
> **最后更新**: 2026-03-27  
> **适用平台**: Windows

---

## 📖 目录

1. [简介](#简介)
2. [安装与启动](#安装与启动)
3. [连接 OpenClaw Agent](#连接-openclaw-agent)
4. [使用终端](#使用终端)
5. [常见问题](#常见问题)
6. [高级功能](#高级功能)

---

## 简介

OpenClaw Canvas 是一个强大的终端集成开发环境，专为与 OpenClaw Agent 协作而设计。它提供：

- 🖥️ **原生终端体验** - 完整的 PTY 支持，兼容所有 Shell
- 🤖 **Agent 集成** - 无缝连接 OpenClaw Agent 进行智能编程辅助
- ⚡ **高性能** - 基于 Electron 构建，响应迅速
- 🔒 **安全可靠** - 本地运行，数据不出设备

---

## 安装与启动

### 系统要求

- **操作系统**: Windows 10/11 (64 位)
- **内存**: 至少 4GB RAM
- **磁盘空间**: 至少 500MB 可用空间
- **Node.js**: v18 或更高版本 (仅开发时需要)

### 安装步骤

1. **下载安装包**
   - 从发布页面下载最新版本的 `OpenClaw-Canvas-Setup-x64-x.y.z.exe`
   - 或下载便携版 `OpenClaw-Canvas-Portable-x.y.z.zip`

2. **运行安装程序**
   ```
   双击安装程序 → 按照向导完成安装
   ```

3. **启动应用**
   - 桌面双击 "OpenClaw Canvas" 图标
   - 或在开始菜单中找到 "OpenClaw Canvas"

### 首次启动

首次启动时，您将看到：

1. **欢迎界面** - 显示快速入门提示
2. **设置面板** - 预配置了默认设置
3. **空白工作区** - 准备创建您的第一个任务

---

## 连接 OpenClaw Agent

### 前置条件

确保 OpenClaw Gateway 正在运行：

```bash
# 检查 Gateway 状态
openclaw gateway status

# 如果未运行，启动它
openclaw gateway start
```

### 配置连接

1. **打开设置**
   - 点击左上角 ⚙️ 图标
   - 或按快捷键 `Ctrl + ,`

2. **进入集成设置**
   - 选择 "集成" 标签页
   - 找到 "OpenClaw API" 部分

3. **验证连接**
   - 默认 Gateway 地址：`http://localhost:9876`
   - 点击 "测试连接" 按钮
   - 看到 "连接成功" 表示配置正确

### OAuth 认证

如果 Gateway 启用了 OAuth 认证：

1. 点击 "授权" 按钮
2. 在浏览器中完成 OAuth 流程
3. 返回应用，令牌将自动保存

### 调用 Agent

连接成功后：

1. **创建新任务**
   - 点击工作区 "+" 按钮
   - 或按 `Ctrl + N`

2. **输入指令**
   ```
   请帮我创建一个 React 组件，实现用户列表展示功能
   ```

3. **等待响应**
   - Agent 将分析任务并执行
   - 终端中将显示执行过程
   - 完成后查看结果

---

## 使用终端

### 终端基础

OpenClaw Canvas 内置完整功能的终端：

- **多标签支持** - 同时运行多个 Shell 会话
- **PTY 后端** - 真正的终端模拟，非简单输出
- **主题定制** - 支持多种配色方案

### 基本操作

| 操作 | 快捷键 | 说明 |
|------|--------|------|
| 新建终端 | `Ctrl + `` ` | 打开新终端标签 |
| 关闭终端 | `Ctrl + W` | 关闭当前终端 |
| 切换标签 | `Ctrl + Tab` | 在终端间切换 |
| 清屏 | `Ctrl + L` | 清除终端内容 |
| 复制 | `Ctrl + C` | 复制选中文本 |
| 粘贴 | `Ctrl + V` | 粘贴剪贴板内容 |

### Shell 配置

默认 Shell 配置：

- **Windows**: PowerShell
- **Linux/macOS**: bash

更改默认 Shell：

1. 打开设置 → "终端"
2. 选择 "默认 Shell 配置文件"
3. 选择您的首选 Shell

### 终端主题

内置主题：

- `Dark` (默认) - 深色主题
- `Light` - 浅色主题
- `Monokai` - 经典 Monokai 配色
- `Dracula` - Dracula 主题

---

## 常见问题

### ❓ EPIPE 启动错误

**问题**: 启动时出现 `Error: write EPIPE`

**解决方案**:

1. 重启 OpenClaw Gateway:
   ```bash
   openclaw gateway restart
   ```

2. 检查端口占用:
   ```bash
   netstat -ano | findstr :9876
   ```

3. 以管理员身份运行应用

4. 如果问题持续，查看日志文件:
   ```
   %APPDATA%\OpenClaw Canvas\logs\main.log
   ```

### ❓ 无法连接 Gateway

**问题**: 连接测试失败，显示 "无法连接"

**排查步骤**:

1. 确认 Gateway 正在运行:
   ```bash
   openclaw gateway status
   ```

2. 检查防火墙设置，确保端口 9876 未被阻止

3. 验证 URL 是否正确 (默认：`http://localhost:9876`)

4. 尝试在浏览器中访问 `http://localhost:9876/health`

### ❓ 终端无响应

**问题**: 终端卡住，无法输入

**解决方案**:

1. 尝试 `Ctrl + C` 中断当前进程

2. 如果无效，关闭并重新打开终端标签

3. 检查是否有后台进程占用 PTY

4. 重启应用

### ❓ OAuth 认证失败

**问题**: OAuth 流程无法完成

**排查步骤**:

1. 确认浏览器可以访问 Gateway URL

2. 检查 OAuth 配置是否正确:
   - 授权端点：`/oauth/authorize`
   - 令牌端点：`/oauth/token`

3. 清除应用缓存后重试

4. 查看 Gateway 日志了解详细错误

---

## 高级功能

### 工作区管理

**创建工作区**:

1. 点击 "工作区" → "新建工作区"
2. 选择项目根目录
3. 工作区将自动保存

**切换工作区**:

- 点击工作区名称下拉菜单
- 选择之前保存的工作区

### 任务模板

创建可复用的任务模板：

1. 设置 → "任务配置"
2. 点击 "添加模板"
3. 填写模板名称和提示词
4. 保存后在创建任务时选择

### 快捷键自定义

修改默认快捷键：

1. 设置 → "快捷键"
2. 搜索要修改的操作
3. 点击并输入新快捷键
4. 保存更改

### 日志与调试

**查看日志**:

- 主进程日志：`%APPDATA%\OpenClaw Canvas\logs\main.log`
- 渲染进程日志：开发者工具 Console

**启用调试模式**:

1. 设置 → "关于"
2. 连续点击版本号 5 次
3. 出现 "调试模式已启用" 提示
4. 重启应用

---

## 📞 获取帮助

### 文档资源

- [官方文档](https://openclaw.dev/docs)
- [GitHub 仓库](https://github.com/openclaw/canvas)
- [问题追踪](https://github.com/openclaw/canvas/issues)

### 社区支持

- Discord: [OpenClaw Community](https://discord.gg/openclaw)
- 论坛：[discuss.openclaw.dev](https://discuss.openclaw.dev)

### 反馈与建议

遇到问题或有改进建议？

1. 在 GitHub 提交 Issue
2. 发送邮件至 support@openclaw.dev
3. 在社区论坛发帖

---

## 📝 更新日志

### v1.0 (2026-03-27)

- ✨ 初始公开发布
- 🔧 修复 EPIPE 启动错误
- 🔌 预置 OpenClaw API 配置
- 📚 添加中文使用教程
- 🪟 改进 Windows 兼容性

---

*本教程由 OpenClaw 团队维护。如有错误或遗漏，请提交 Issue 或 Pull Request。*

# OpenCove Canvas v0.2.1 紧急更新包

> **更新日期**: 2026-03-27  
> **版本**: v0.2.1  
> **状态**: ✅ 代码已完成，待 Windows 构建

---

## 🚨 紧急修复内容

### 问题 1: EPIPE 启动错误 ✅ 已修复

**症状**:
```
Error: write EPIPE at afterWriteDispatched (node:internal/stream_base_commons:159:15)
```

**修复**:
- 增强 PTY Host 错误处理
- 添加 EPIPE 检测和自动恢复
- 优化 Windows conpty 兼容性

### 问题 2: 缺少 OpenClaw API 配置 ✅ 已集成

**新增**:
- 预置 Gateway: `http://localhost:9876`
- OAuth 端点自动配置
- 连接测试功能

### 问题 3: 缺少使用教程 ✅ 已编写

**新增**:
- `docs/TUTORIAL_ZH.md` - 完整中文教程
- `BUILD_WINDOWS.md` - Windows 构建指南
- `release/RELEASE_NOTES_v0.2.1.md` - 版本更新说明

---

## 📦 构建说明

### 在 Windows 上构建

```powershell
# 1. 进入项目目录
cd C:\path\to\opencove-canvas

# 2. 安装依赖
pnpm install

# 3. 构建 Windows 版本
pnpm build:win

# 4. 输出文件
# - dist/OpenCove-0.2.1-win-x64.exe
# - dist/OpenCove-0.2.1-win-x64.zip (可选)
```

### 构建前置条件

- Node.js v22+
- pnpm v9+
- Python 3.x
- Visual Studio Build Tools (C++)

详见 `BUILD_WINDOWS.md`

---

## 📁 重要文件

| 文件 | 说明 |
|------|------|
| `docs/TUTORIAL_ZH.md` | 中文使用教程 |
| `BUILD_WINDOWS.md` | Windows 构建指南 |
| `release/RELEASE_NOTES_v0.2.1.md` | 版本更新说明 |
| `TASK_COMPLETION_SUMMARY.md` | 任务完成报告 |
| `CHANGELOG.md` | 完整变更日志 |

---

## ✅ 验证清单

构建完成后请验证：

- [ ] TypeScript 编译通过 (`pnpm check`)
- [ ] 应用可以正常启动
- [ ] 终端功能正常
- [ ] 设置面板显示 OpenClaw API 配置
- [ ] 连接测试功能可用
- [ ] 无 EPIPE 错误

---

## 📞 联系

- **开发者**: deadwavewave@gmail.com
- **GitHub**: https://github.com/DeadWaveWave/opencove
- **问题反馈**: https://github.com/DeadWaveWave/opencove/issues

---

*紧急更新包 - 兵部制备*

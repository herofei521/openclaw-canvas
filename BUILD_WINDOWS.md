# Windows 构建指南

> 本文档说明如何在 Windows 系统上构建 OpenCove Canvas 的 Windows 版本。

---

## 📋 前置条件

### 系统要求

- **操作系统**: Windows 10/11 (64 位)
- **Node.js**: v22 或更高版本
- **pnpm**: v9 或更高版本
- **Python**: 3.x (用于 node-gyp)
- **Visual Studio Build Tools**: 包含 C++ 构建工具

### 安装步骤

1. **安装 Node.js**
   ```powershell
   # 从 https://nodejs.org 下载并安装 Node.js v22 LTS
   ```

2. **安装 pnpm**
   ```powershell
   npm install -g pnpm
   ```

3. **安装 Python**
   ```powershell
   # 从 https://python.org 下载并安装 Python 3.x
   # 安装时勾选 "Add Python to PATH"
   ```

4. **安装 Visual Studio Build Tools**
   ```powershell
   # 从 https://visualstudio.microsoft.com/downloads/ 下载
   # 选择 "Desktop development with C++"
   ```

5. **配置 node-gyp**
   ```powershell
   npm config set msvs_version 2022
   npm config set python python3
   ```

---

## 🚀 构建步骤

### 1. 克隆/更新代码

```powershell
cd C:\path\to\opencove-canvas
git pull origin main
```

### 2. 安装依赖

```powershell
pnpm install
```

### 3. 构建应用

```powershell
# 构建 Windows 安装版
pnpm build:win

# 或构建便携版（需要先修改 electron-builder 配置）
pnpm build && pnpm build:release-manifest && electron-builder --win --dir --publish never
```

### 4. 查找输出文件

构建完成后，输出文件位于：

- **安装版**: `dist/OpenCove-0.2.1-win-x64.exe`
- **便携版**: `dist/win-unpacked/` 目录

---

## 📦 打包发布

### 创建 ZIP 包

```powershell
# 进入输出目录
cd dist\win-unpacked

# 创建 ZIP 包
Compress-Archive -Path * -DestinationPath ..\OpenCove-0.2.1-Portable-win-x64.zip
```

### 生成校验和

```powershell
# SHA256 校验和
certutil -hashfile ..\OpenCove-0.2.1-win-x64.exe SHA256
certutil -hashfile ..\OpenCove-0.2.1-Portable-win-x64.zip SHA256
```

---

## 🔧 故障排查

### 问题：node-gyp 构建失败

**错误信息**:
```
gyp ERR! find VS
gyp ERR! find VS msvs_version was set from "node"
```

**解决方案**:
```powershell
npm config set msvs_version 2022
npm config set python python3
pnpm install
```

### 问题：代码签名失败

**错误信息**:
```
Error: No certificate found
```

**解决方案**:
- 开发构建不需要代码签名
- 如需签名，请安装有效的代码签名证书

### 问题：依赖安装失败

**错误信息**:
```
ERR_PNPM_FETCH_404
```

**解决方案**:
```powershell
pnpm store prune
pnpm install --force
```

---

## 📝 构建配置

### electron-builder 配置

位于 `package.json` 的 `build` 字段：

```json
{
  "build": {
    "appId": "dev.deadwave.opencove",
    "productName": "OpenCove",
    "executableName": "OpenCove",
    "artifactName": "${productName}-${version}-${os}-${arch}.${ext}",
    "win": {
      "icon": "build/icon.ico"
    }
  }
}
```

### 修改输出格式

如需修改输出格式，编辑 `package.json`:

```json
{
  "build": {
    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64"] },
        { "target": "zip", "arch": ["x64"] }
      ]
    }
  }
}
```

---

## ✅ 构建验证

构建完成后，验证以下内容：

1. **文件完整性**
   - [ ] exe/zip 文件存在
   - [ ] 文件大小合理 (>50MB)
   - [ ] 校验和匹配

2. **功能测试**
   - [ ] 应用可以启动
   - [ ] 终端正常工作
   - [ ] 设置面板可访问
   - [ ] OpenClaw API 连接测试通过

3. **文档完整性**
   - [ ] CHANGELOG.md 已更新
   - [ ] RELEASE_NOTES_v0.2.1.md 已创建
   - [ ] docs/TUTORIAL_ZH.md 已创建

---

## 📞 需要帮助？

- **GitHub Issues**: https://github.com/DeadWaveWave/opencove/issues
- **邮件**: deadwavewave@gmail.com

---

*最后更新：2026-03-27*

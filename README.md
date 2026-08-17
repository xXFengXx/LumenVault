# LumenVault

LumenVault 是一个基于 Electron、React 和 TypeScript 构建的本地知识库桌面应用。你可以导入 `.txt` 和 `.md` 文档，并在右侧问答面板中检索本地内容。所有文档和索引数据均保存在电脑本地，不依赖外部 API。

## 功能

- 左侧文档列表展示已导入的本地文档
- 支持导入 `.txt` 和 `.md` 文件，单个文件最大 10 MB
- 支持删除已导入的文档
- 右侧问答面板根据本地文档内容检索答案
- 回答附带相关文档引用和置信度
- 使用 Electron 安全隔离：`contextIsolation: true`、`nodeIntegration: false`
- 自动创建并使用本地数据目录

## 技术栈

- Electron
- React 18
- TypeScript（严格模式）
- Vite

## 安装

需要 Node.js 22 或更高版本。在项目根目录运行：

```powershell
npm install
```

如果 Electron 二进制下载较慢，可以使用镜像：

```powershell
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
node node_modules\electron\install.js
```

确认 Electron 已正确安装：

```powershell
Test-Path node_modules\electron\dist\electron.exe
```

返回 `True` 即表示安装完成。

## 运行

部分开发环境会设置 `ELECTRON_RUN_AS_NODE=1`。启动前应先清除该变量：

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npm run dev
```

`npm run dev` 会先构建项目，然后启动 Electron 窗口。

## 开发与验证

```powershell
# TypeScript 类型检查
npm run check

# 生产构建
npm run build

# 安装依赖并执行完整构建检查
bash init.sh
```

构建结果输出到 `dist/`：

```text
dist/
  main/       Electron 主进程
  preload/    安全 IPC 桥接层
  renderer/   React 用户界面
  services/   本地业务服务
  shared/     共享类型
```

## 本地数据

应用通过 Electron 的 `app.getPath('userData')` 确定数据位置。在 Windows 上，默认目录为：

```text
%APPDATA%\lumen-vault\knowledge-base-data
```

目录结构如下：

```text
knowledge-base-data/
  documents-meta.json  文档元数据
  content/             导入的文档内容
  chunks/              文档分块数据
  index/               本地索引数据
```

删除项目目录或重新安装依赖不会自动删除这里的用户数据。

## 项目结构

```text
src/
  main/       窗口生命周期和 IPC 注册
  preload/    暴露 window.knowledgeBase API
  renderer/   React 界面
  services/   文档、问答和持久化逻辑
  shared/     IPC 通道与共享 TypeScript 类型
```

渲染进程不直接访问 Node.js、文件系统或 Electron API，所有本地操作均通过 preload 暴露的类型化 IPC 接口完成。

## 常见问题

### Electron 安装时报 `TypeError: fetch failed`

通常是 Electron 二进制无法从默认下载源获取。设置镜像后重新执行安装脚本：

```powershell
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
node node_modules\electron\install.js
```

### 运行后没有弹出窗口

先确认 Electron 文件存在，并清除 `ELECTRON_RUN_AS_NODE`：

```powershell
Test-Path node_modules\electron\dist\electron.exe
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npm run dev
```

## 隐私

LumenVault 当前版本只进行本地处理，不发送文档内容或问题到网络服务。

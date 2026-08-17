# Lumen Vault

一个基于 Electron 的本地优先知识库应用。左侧管理和编辑文档，右侧可针对全部本地文档进行问答检索。

## 运行

```bash
npm install
npm start
```

首次启动时，应用会在 Electron 的 `userData` 目录下自动创建 `LumenVaultData/documents.json`。界面左下角会显示实际路径，点击右上角菜单可在系统文件管理器中打开该目录。

## 功能

- 新建、编辑、删除、搜索文档，修改自动保存
- 导入 `.txt`、`.md` 和 `.markdown` 文件
- 基于本地文档的离线关键词检索问答
- 原子化 JSON 写入，渲染进程不直接接触文件系统

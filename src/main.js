const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');

let dataDir;
let documentsFile;

const starterDocuments = [
  {
    id: 'welcome',
    title: '欢迎使用 Lumen Vault',
    content: `# 欢迎使用 Lumen Vault\n\n这是一个完全本地运行的知识库。你可以在左侧创建、搜索和整理文档，在右侧针对全部知识内容提问。\n\n所有数据都保存在应用的本地数据目录中，不会上传到云端。`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'quick-start',
    title: '快速开始',
    content: `# 快速开始\n\n1. 点击左上角的“新建文档”。\n2. 在编辑区记录你的知识。\n3. 修改会自动保存。\n4. 在右侧输入问题，Lumen 会从本地文档中寻找相关内容。`,
    updatedAt: new Date(Date.now() - 60000).toISOString()
  }
];

async function ensureDataDirectory() {
  dataDir = path.join(app.getPath('userData'), 'LumenVaultData');
  documentsFile = path.join(dataDir, 'documents.json');
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(documentsFile);
  } catch {
    await fs.writeFile(documentsFile, JSON.stringify(starterDocuments, null, 2), 'utf8');
  }
}

async function readDocuments() {
  try {
    const raw = await fs.readFile(documentsFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not read documents:', error);
    return [];
  }
}

async function writeDocuments(documents) {
  const temporary = `${documentsFile}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(documents, null, 2), 'utf8');
  await fs.rename(temporary, documentsFile);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1020,
    minHeight: 680,
    backgroundColor: '#f4f4ef',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(async () => {
  await ensureDataDirectory();

  ipcMain.handle('documents:list', readDocuments);
  ipcMain.handle('documents:save', async (_event, document) => {
    const documents = await readDocuments();
    const now = new Date().toISOString();
    const cleanDocument = {
      id: document.id || crypto.randomUUID(),
      title: String(document.title || '无标题文档').slice(0, 160),
      content: String(document.content || ''),
      updatedAt: now
    };
    const index = documents.findIndex((item) => item.id === cleanDocument.id);
    if (index >= 0) documents[index] = cleanDocument;
    else documents.unshift(cleanDocument);
    await writeDocuments(documents);
    return cleanDocument;
  });
  ipcMain.handle('documents:delete', async (_event, id) => {
    const documents = (await readDocuments()).filter((item) => item.id !== id);
    await writeDocuments(documents);
    return true;
  });
  ipcMain.handle('documents:import', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: '文本与 Markdown', extensions: ['txt', 'md', 'markdown'] }]
    });
    if (result.canceled) return [];
    const documents = await readDocuments();
    const imported = [];
    for (const filePath of result.filePaths) {
      const content = await fs.readFile(filePath, 'utf8');
      const document = {
        id: crypto.randomUUID(),
        title: path.basename(filePath, path.extname(filePath)),
        content,
        updatedAt: new Date().toISOString()
      };
      documents.unshift(document);
      imported.push(document);
    }
    await writeDocuments(documents);
    return imported;
  });
  ipcMain.handle('app:data-path', () => dataDir);
  ipcMain.handle('app:open-data-path', () => shell.openPath(dataDir));

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

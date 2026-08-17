import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { PersistenceService } from '../services/persistence-service';
import { DocumentService } from '../services/document-service';
import { QaService } from '../services/qa-service';
import { registerIpcHandlers } from './ipc-handlers';

async function start(): Promise<void> {
  const persistence = new PersistenceService(path.join(app.getPath('userData'), 'knowledge-base-data'));
  await persistence.initialize(); registerIpcHandlers(persistence, new DocumentService(persistence), new QaService(persistence));
  const window = new BrowserWindow({ width: 1200, height: 800, minWidth: 900, minHeight: 600, backgroundColor: '#0b1020', webPreferences: { preload: path.join(__dirname, '../preload/preload.js'), contextIsolation: true, nodeIntegration: false } });
  await window.loadFile(path.join(__dirname, '../renderer/index.html'));
}
app.whenReady().then(start).catch(console.error);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) void start(); });

import { dialog, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import { DocumentService } from '../services/document-service';
import { QaService } from '../services/qa-service';
import { PersistenceService } from '../services/persistence-service';

export function registerIpcHandlers(persistence: PersistenceService, documents: DocumentService, qa: QaService): void {
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_LIST, () => documents.list());
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_IMPORT, async () => { const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters: [{ name: '文本文档', extensions: ['txt', 'md'] }] }); return result.canceled ? [] : documents.importFiles(result.filePaths); });
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_DELETE, (_event, id: string) => documents.delete(id));
  ipcMain.handle(IPC_CHANNELS.QA_ASK, (_event, question: string) => qa.ask(question));
  ipcMain.handle(IPC_CHANNELS.DATA_DIRECTORY, () => persistence.dataDirectory);
}

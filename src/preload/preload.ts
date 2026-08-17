import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type KnowledgeBaseApi } from '../shared/types';
const api: KnowledgeBaseApi = {
  documents: { list: () => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_LIST), import: () => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_IMPORT), delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_DELETE, id) },
  qa: { ask: (question) => ipcRenderer.invoke(IPC_CHANNELS.QA_ASK, question) },
  system: { dataDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DATA_DIRECTORY) }
};
contextBridge.exposeInMainWorld('knowledgeBase', api);

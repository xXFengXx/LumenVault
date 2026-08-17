const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vaultAPI', {
  listDocuments: () => ipcRenderer.invoke('documents:list'),
  saveDocument: (document) => ipcRenderer.invoke('documents:save', document),
  deleteDocument: (id) => ipcRenderer.invoke('documents:delete', id),
  importDocuments: () => ipcRenderer.invoke('documents:import'),
  getDataPath: () => ipcRenderer.invoke('app:data-path'),
  openDataPath: () => ipcRenderer.invoke('app:open-data-path')
});

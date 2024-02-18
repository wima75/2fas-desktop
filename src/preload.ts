// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadData: (callback: any) => ipcRenderer.on('loadData', (_event, value) => callback(value)),
  requestData: () => ipcRenderer.send('requestData'),
  requestImport: () => ipcRenderer.send('requestImport'),
  copyToken: (token: string) => ipcRenderer.send('copyToken', token)
})

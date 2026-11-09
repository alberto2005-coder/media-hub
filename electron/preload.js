'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hub', {
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  scanFolder: (dir) => ipcRenderer.invoke('scan-folder', dir),
  fetchText: (url) => ipcRenderer.invoke('fetch-text', url),
  openPath: (p) => ipcRenderer.invoke('open-path', p),
  getConfig: () => ipcRenderer.invoke('get-config'),
  configInfo: () => ipcRenderer.invoke('config-info'),
  initEnv: () => ipcRenderer.invoke('init-env')
});

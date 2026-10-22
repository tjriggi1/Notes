const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  state: () => ipcRenderer.invoke('state'),
  addQuarter: () => ipcRenderer.invoke('quarter:add'),
  onAddQuarter: cb => ipcRenderer.on('menu:add-quarter', cb),
  addClass: n => ipcRenderer.invoke('class:add', n),
  renameClass: (id, n) => ipcRenderer.invoke('class:rename', id, n),
  deleteClass: id => ipcRenderer.invoke('class:delete', id),
  saveDraft: (id, t) => ipcRenderer.invoke('draft:save', id, t),
  addImage: (classId, bytes, mime) => ipcRenderer.invoke('image:add', classId, bytes, mime),
  removeImage: (classId, label) => ipcRenderer.invoke('image:remove', classId, label),
  imageData: (file, mime) => ipcRenderer.invoke('image:data', file, mime),
  setSettings: p => ipcRenderer.invoke('settings:set', p),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  showFile: p => ipcRenderer.invoke('open-file', p),
  submit: p => ipcRenderer.invoke('submit', p),
});

const { contextBridge, ipcRenderer } = require('electron');

// Electron API를 안전하게 렌더러 프로세스에 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 오버레이 창 관리
  createOverlay: (noteData) => ipcRenderer.invoke('create-overlay', noteData),
  closeOverlay: (noteId) => ipcRenderer.invoke('close-overlay', noteId),
  updateOverlayPosition: (noteId, x, y) => ipcRenderer.invoke('update-overlay-position', noteId, x, y),
  updateOverlaySize: (noteId, width, height) => ipcRenderer.invoke('update-overlay-size', noteId, width, height),
  getWindowSize: (noteId) => ipcRenderer.invoke('get-window-size', noteId),
  
  // 데이터 관리 API
  getAllNotes: () => ipcRenderer.invoke('get-all-notes'),
  createNote: (noteData) => ipcRenderer.invoke('create-note', noteData),
  updateNote: (noteId, updates) => ipcRenderer.invoke('update-note', noteId, updates),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
  updateNotePosition: (noteId, x, y) => ipcRenderer.invoke('update-note-position', noteId, x, y),
  updateNoteSize: (noteId, width, height) => ipcRenderer.invoke('update-note-size', noteId, width, height),
  
  // 실시간 이벤트 리스너
  onNoteCreated: (callback) => ipcRenderer.on('note-created', (event, note) => callback(note)),
  onNoteUpdated: (callback) => ipcRenderer.on('note-updated', (event, note) => callback(note)),
  onNoteDeleted: (callback) => ipcRenderer.on('note-deleted', (event, noteId) => callback(noteId)),
  
  // Electron 확인
  isElectron: true
});

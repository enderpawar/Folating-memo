const { contextBridge, ipcRenderer } = require('electron');

// Electron API를 안전하게 렌더러 프로세스에 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 오버레이 창 생성
  createOverlay: (noteData) => ipcRenderer.invoke('create-overlay', noteData),
  
  // 오버레이 창 닫기
  closeOverlay: (noteId) => ipcRenderer.invoke('close-overlay', noteId),
  
  // 오버레이 창 위치 업데이트
  updateOverlayPosition: (noteId, x, y) => ipcRenderer.invoke('update-overlay-position', noteId, x, y),
  
  // 오버레이 창 크기 업데이트
  updateOverlaySize: (noteId, width, height) => ipcRenderer.invoke('update-overlay-size', noteId, width, height),
  
  // 현재 창 크기 가져오기
  getWindowSize: (noteId) => ipcRenderer.invoke('get-window-size', noteId),
  
  // 모든 노트 정보 가져오기
  getAllNotes: () => ipcRenderer.invoke('get-all-notes'),
  
  // 현재 창 타입 확인
  isElectron: true
});

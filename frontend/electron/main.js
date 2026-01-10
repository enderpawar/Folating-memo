import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터 저장소 초기화
const store = new Store({
  defaults: {
    notes: [],
    nextId: 1
  }
});

let settingsWindow = null;
const overlayWindows = new Map(); // noteId -> BrowserWindow

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 개발 모드에서는 Vite 서버 주소, 프로덕션에서는 빌드된 파일
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    settingsWindow.loadURL('http://localhost:5175?window=settings');
    settingsWindow.webContents.openDevTools();
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { window: 'settings' }
    });
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function createOverlayWindow(noteData) {
  const { id, content, positionX, positionY, width, height } = noteData;
  
  const fixedWidth = width || 300;
  const fixedHeight = height || 300;
  
  const overlayWindow = new BrowserWindow({
    width: fixedWidth,
    height: fixedHeight,
    minWidth: 150,
    minHeight: 150,
    x: positionX || 100,
    y: positionY || 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // 창의 현재 크기를 저장
  overlayWindow.allowedSize = { width: fixedWidth, height: fixedHeight };
  overlayWindow.isManualResize = false;
  overlayWindow.isResizing = false; // 리사이즈 중인지 표시
  
  // resize 이벤트로 크기 변경 감지 및 즉시 복원
  overlayWindow.on('resize', () => {
    if (overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.allowedSize) {
      const [currentWidth, currentHeight] = overlayWindow.getSize();
      const { width, height } = overlayWindow.allowedSize;
      
      // 크기가 변경되었다면 즉시 복원
      if (currentWidth !== width || currentHeight !== height) {
        const [x, y] = overlayWindow.getPosition();
        overlayWindow.setBounds({ x, y, width, height }, false);
      }
    }
  });
  
  // will-resize로 크기 변경 차단 (비활성화 모드에서는 불필요하지만 보험용)
  overlayWindow.on('will-resize', (event) => {
    // resizable: false일 때는 모든 크기 변경 차단
    if (!overlayWindow.isResizable()) {
      event.preventDefault();
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  const urlParams = `?window=overlay&noteId=${id}&content=${encodeURIComponent(content)}`;
  
  if (isDev) {
    overlayWindow.loadURL(`http://localhost:5175${urlParams}`);
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { window: 'overlay', noteId: id, content: content }
    });
  }

  overlayWindow.setIgnoreMouseEvents(false);
  
  overlayWindow.on('closed', () => {
    overlayWindows.delete(id);
  });

  overlayWindows.set(id, overlayWindow);
  return overlayWindow;
}

function closeOverlayWindow(noteId) {
  const window = overlayWindows.get(noteId);
  if (window && !window.isDestroyed()) {
    window.close();
  }
  overlayWindows.delete(noteId);
}

function updateOverlayPosition(noteId, x, y) {
  const window = overlayWindows.get(noteId);
  if (window && !window.isDestroyed()) {
    // 위치만 변경
    window.setPosition(x, y, false);
    
    // 데이터 저장
    const notes = store.get('notes', []);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      note.positionX = x;
      note.positionY = y;
      store.set('notes', notes);
    }
  }
}

function updateOverlaySize(noteId, width, height) {
  const window = overlayWindows.get(noteId);
  if (window && !window.isDestroyed()) {
    // 최소 크기 제한
    const finalWidth = Math.max(150, width);
    const finalHeight = Math.max(150, height);
    
    // 새 크기 저장
    window.allowedSize = { width: finalWidth, height: finalHeight };
    
    // 데이터 저장
    const notes = store.get('notes', []);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      note.width = finalWidth;
      note.height = finalHeight;
      store.set('notes', notes);
    }
    
    // 일시적으로 resizable 활성화 및 크기 제한 제거
    window.setResizable(true);
    window.setMinimumSize(0, 0);
    window.setMaximumSize(0, 0);
    
    // 현재 위치 가져오기
    const [currentX, currentY] = window.getPosition();
    
    // setBounds로 크기 변경 (위치는 유지)
    window.setBounds({
      x: currentX,
      y: currentY,
      width: finalWidth,
      height: finalHeight
    }, false);
    
    // 즉시 resizable 비활성화 (드래그 중 크기 증가 완전 차단)
    window.setMinimumSize(finalWidth, finalHeight);
    window.setResizable(false);
  }
}

function getWindowSize(noteId) {
  const window = overlayWindows.get(noteId);
  if (window && !window.isDestroyed()) {
    const [width, height] = window.getSize();
    return { width, height };
  }
  return { width: 300, height: 300 };
}

// IPC Handlers
ipcMain.handle('create-overlay', (event, noteData) => {
  createOverlayWindow(noteData);
});

ipcMain.handle('close-overlay', (event, noteId) => {
  closeOverlayWindow(noteId);
});

ipcMain.handle('update-overlay-position', (event, noteId, x, y) => {
  updateOverlayPosition(noteId, x, y);
});

ipcMain.handle('update-overlay-size', (event, noteId, width, height) => {
  updateOverlaySize(noteId, width, height);
});

ipcMain.handle('get-window-size', (event, noteId) => {
  return getWindowSize(noteId);
});

// ========================
// 데이터 관리 IPC Handlers
// ========================

// 모든 노트 가져오기
ipcMain.handle('get-all-notes', () => {
  const notes = store.get('notes', []);
  return notes;
});

// 노트 생성
ipcMain.handle('create-note', (event, noteData) => {
  const notes = store.get('notes', []);
  const nextId = store.get('nextId', 1);
  
  const newNote = {
    id: nextId,
    content: noteData.content,
    positionX: noteData.positionX || 100,
    positionY: noteData.positionY || 100,
    width: noteData.width || 300,
    height: noteData.height || 300,
    createdAt: new Date().toISOString()
  };
  
  notes.push(newNote);
  store.set('notes', notes);
  store.set('nextId', nextId + 1);
  
  // 오버레이 창 생성
  createOverlayWindow(newNote);
  
  // 메인 창에 알림 (실시간 업데이트)
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('note-created', newNote);
  }
  
  return newNote;
});

// 노트 업데이트
ipcMain.handle('update-note', (event, noteId, updates) => {
  const notes = store.get('notes', []);
  const index = notes.findIndex(n => n.id === noteId);
  
  if (index !== -1) {
    notes[index] = { ...notes[index], ...updates };
    store.set('notes', notes);
    
    // 메인 창에 알림
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('note-updated', notes[index]);
    }
    
    return notes[index];
  }
  
  return null;
});

// 노트 삭제
ipcMain.handle('delete-note', (event, noteId) => {
  const notes = store.get('notes', []);
  const filteredNotes = notes.filter(n => n.id !== noteId);
  
  store.set('notes', filteredNotes);
  
  // 오버레이 창 닫기
  closeOverlayWindow(noteId);
  
  // 메인 창에 알림
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('note-deleted', noteId);
  }
  
  return { success: true };
});

// 노트 위치 업데이트 (드래그 시)
ipcMain.handle('update-note-position', (event, noteId, x, y) => {
  const notes = store.get('notes', []);
  const note = notes.find(n => n.id === noteId);
  
  if (note) {
    note.positionX = x;
    note.positionY = y;
    store.set('notes', notes);
  }
});

// 노트 크기 업데이트 (리사이즈 시)
ipcMain.handle('update-note-size', (event, noteId, width, height) => {
  const notes = store.get('notes', []);
  const note = notes.find(n => n.id === noteId);
  
  if (note) {
    note.width = width;
    note.height = height;
    store.set('notes', notes);
  }
});

// ========================
// 앱 시작
// ========================
app.whenReady().then(() => {
  createSettingsWindow();
  
  // 저장된 노트들을 자동으로 복원
  const notes = store.get('notes', []);
  notes.forEach(note => {
    createOverlayWindow(note);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSettingsWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

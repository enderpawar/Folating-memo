import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    settingsWindow.loadURL('http://localhost:5174?window=settings');
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
    overlayWindow.loadURL(`http://localhost:5174${urlParams}`);
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

ipcMain.handle('get-all-notes', () => {
  // 설정창에서 모든 노트 정보를 요청할 때
  return Array.from(overlayWindows.keys());
});

// 앱 시작
app.whenReady().then(() => {
  createSettingsWindow();

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

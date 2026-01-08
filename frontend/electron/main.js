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
  
  const overlayWindow = new BrowserWindow({
    width: width || 300,
    height: height || 300,
    x: positionX || 100,
    y: positionY || 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
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
    window.setPosition(x, y);
  }
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

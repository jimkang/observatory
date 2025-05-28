import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  IpcMainInvokeEvent,
  OpenDialogOptions,
  SaveDialogOptions,
} from 'electron';
import path from 'node:path';
import fsPromises from 'node:fs/promises';
import { Buffer } from 'node:buffer';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  win = null;
});

app.whenReady().then(() => {
  ipcMain.handle('readFile', runFileRead);
  ipcMain.handle('writeFile', runFileWrite);
  ipcMain.handle('showSaveDialog', runShowSaveDialog);
  ipcMain.handle('showOpenDialog', runShowOpenDialog);
  createWindow();
});

function runFileRead(
  _e: IpcMainInvokeEvent,
  filePath: string,
  opts: Record<string, string>
) {
  return fsPromises.readFile(filePath, opts);
}

function runFileWrite(
  _e: IpcMainInvokeEvent,
  filePath: string,
  bufferOrString: string | Buffer
) {
  if (Buffer.isBuffer(bufferOrString)) {
    return fsPromises.writeFile(filePath, bufferOrString);
  }
  if (typeof bufferOrString === 'string') {
    return fsPromises.writeFile(filePath, Buffer.from(bufferOrString, 'utf8'));
  }
}

function runShowSaveDialog(_e: IpcMainInvokeEvent, opts: SaveDialogOptions) {
  return dialog.showSaveDialog(opts);
}

function runShowOpenDialog(_e: IpcMainInvokeEvent, opts: OpenDialogOptions) {
  return dialog.showOpenDialog(opts);
}

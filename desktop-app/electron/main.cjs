const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('node:path');
const { fork } = require('node:child_process');
const http = require('node:http');

let serverProcess = null;
let mainWindow = null;

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms`);
}

async function startServer(port) {
  const isDev = !app.isPackaged;
  let serverScript;

  if (isDev) {
    serverScript = path.join(__dirname, '../.next/standalone/desktop-app/server.js');
  } else {
    serverScript = path.join(process.resourcesPath, 'standalone/desktop-app/server.js');
  }

  serverProcess = fork(serverScript, [], {
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
      SKY_MOVIE_DATA_DIR: app.getPath('userData')
    },
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
  });
}

async function createWindow(url) {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Sky Movie',
    backgroundColor: '#000000',
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../build/favicon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }

  await mainWindow.loadURL(url);
}

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

app.whenReady().then(async () => {
  try {
    process.env.SKY_MOVIE_DATA_DIR = app.getPath('userData');
    let serverUrl = process.env.DEV_SERVER_URL;

    if (!serverUrl) {
      const port = await getAvailablePort();
      await startServer(port);
      serverUrl = `http://127.0.0.1:${port}`;
    }

    await waitForServer(serverUrl);
    await createWindow(serverUrl);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(serverUrl);
      }
    });
  } catch (err) {
    console.error('Failed to start application:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

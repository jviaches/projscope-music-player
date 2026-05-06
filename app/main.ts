import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as remoteMain from '@electron/remote/main';

let win: BrowserWindow = null;

const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 500,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false,  // false if you want to run e2e test with Spectron
      plugins: true,
      backgroundThrottling: false,
      nativeWindowOpen: false,
      webSecurity: !serve
    },
    titleBarStyle: 'hiddenInset',
    frame: false,
    resizable: false,
    transparent: true,
    minimizable: true,
    maximizable: false,
    closable: false,
    icon: path.join(__dirname, '/../src/assets/icons/vinyl.png')
  });

  remoteMain.enable(win.webContents);

  if (serve) {
    win.webContents.openDevTools();
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../node_modules/electron'))
    });
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    win.loadURL(url.format({
      pathname: path.join(__dirname, pathIndex),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

const supportedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.webm'];

ipcMain.on('open-file-dialog', (event) => {
  dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Music files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'webm'] }],
  }).then(res => {
    if (!res.canceled && res.filePaths.length > 0) {
      event.sender.send('add-media', res.filePaths);
    }
  });
});

ipcMain.on('open-folder-dialog', (event) => {
  dialog.showOpenDialog(win, {
    title: 'Select music folder',
    properties: ['openDirectory'],
  }).then(res => {
    if (res.canceled || res.filePaths.length === 0) return;
    const musicFiles: string[] = [];

    const scanFolder = (dirPath: string) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          scanFolder(fullPath);
        } else if (entry.isFile() && supportedExtensions.includes(path.extname(entry.name).toLowerCase())) {
          musicFiles.push(fullPath);
        }
      }
    };

    scanFolder(res.filePaths[0]);
    if (musicFiles.length > 0) event.sender.send('add-media', musicFiles);
  });
});

ipcMain.on('resize-app', (_event, height: number) => {
  win.resizable = true;
  win.setSize(win.getSize()[0], height);
  win.resizable = false;
});

ipcMain.on('minimize-app', () => win.minimize());

ipcMain.on('close-app', () => app.exit(0));

try {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  remoteMain.initialize();

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

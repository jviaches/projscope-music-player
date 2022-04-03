"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var fs = require("fs");
var url = require("url");
var remoteMain = require("@electron/remote/main");
var win = null;
var args = process.argv.slice(1), serve = args.some(function (val) { return val === '--serve'; });
function createWindow() {
    // Create the browser window.
    win = new electron_1.BrowserWindow({
        x: 0,
        y: 0,
        width: 500,
        height: 170,
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: (serve) ? true : false,
            contextIsolation: false,
            plugins: true,
            backgroundThrottling: false,
            nativeWindowOpen: false,
            webSecurity: false
        },
        titleBarStyle: 'hiddenInset',
        frame: false,
        resizable: false,
        transparent: true,
        minimizable: false,
        maximizable: false,
        closable: false,
    });
    remoteMain.enable(win.webContents);
    if (serve) {
        win.webContents.openDevTools();
        require('electron-reload')(__dirname, {
            electron: require(path.join(__dirname, '/../node_modules/electron'))
        });
        win.loadURL('http://localhost:4200');
    }
    else {
        // Path when running electron executable
        var pathIndex = './index.html';
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
    win.webContents.on('ipc-message', function (event, input, args) {
        if (input === 'open-file-dialog') {
            electron_1.dialog.showOpenDialog(null, {
                properties: ['openFile', 'multiSelections'],
                filters: [{ name: 'MP3 Media files', extensions: ['mp3'] }],
            }).then(function (res) {
                if (res.filePaths) {
                    win.webContents.send("add-media", res.filePaths);
                }
            });
        }
        if (input === 'resize-app') {
            win.resizable = true;
            win.setSize(win.getSize()[0], args);
            win.resizable = false;
        }
        if (input === 'minimize-app') {
            win.minimize();
        }
        if (input === 'close-app') {
            // bypass all listeners
            electron_1.app.exit(0);
        }
    });
    // Emitted when the window is closed.
    win.on('closed', function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
    return win;
}
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    electron_1.app.on('ready', function () { return setTimeout(createWindow, 400); });
    // Quit when all windows are closed.
    electron_1.app.on('window-all-closed', function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    electron_1.app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
}
catch (e) {
    // Catch Error
    // throw e;
}
//# sourceMappingURL=main.js.map
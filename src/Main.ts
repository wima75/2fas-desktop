import { BrowserWindow, Menu, app, clipboard, dialog, ipcMain } from "electron";
import EventEmitter from 'events';
import * as fs from 'fs';
import path from "path";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

class Main {

  public onEvent: EventEmitter = new EventEmitter();
  window!: BrowserWindow;

  public constructor() {
    app.on('ready', () => {
      this.window = this.createWindow();
      this.onEvent.emit('window-created');
    });

    app.on('window-all-closed', this.onWindowAllClosed);
    
    app.on('activate', this.onActivate);
  }

  private onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
}

  private onActivate() {
    if (!this.window) {
    this.createWindow();
    }
  }

  private createWindow() {
    const mainWindow = new BrowserWindow({
      height: 650,
      width: 450,
      webPreferences: {
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });

    const menuTemplate: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Import',
            click: () => this.onImport(mainWindow)
          }
        ]
      },
      {
      label: 'Edit',
      submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' }
      ]
  },
  {
      label: 'View',
      submenu: [
          { role: 'reload' }
      ]
  },
  { role: 'window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
  /*{
      role: 'help',
      submenu: [{
          label: 'Learn More',
          click() {
              //require('electron').shell.openExternal('https://electron.atom.io');
          }
      }]
  }*/
  ];

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    
    ipcMain.on('requestData', () => {
      const dataPath = this.getDataPath();
      if (fs.existsSync(dataPath)) {
        const data = this.loadData(dataPath);
        mainWindow.webContents.send('loadData', data);
      }
    });

    ipcMain.on('requestImport', () => {
      this.onImport(mainWindow);
    });

    ipcMain.on('copyToken', (_event, token: string) => {
      clipboard.writeText(token);
    });

    //mainWindow.webContents.openDevTools();

    return mainWindow;
  }

  private loadData(dataPath: string): any {
    const file = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(file);
    return data;
  }

  private getDataPath(): string {
    return path.join(app.getPath('userData'), 'tokens.json');
  }

  private async onImport(mainWindow: BrowserWindow) {
    const result = await dialog.showOpenDialog({properties: ['openFile']});
    const data = this.loadData(result.filePaths[0]);

    fs.writeFileSync(this.getDataPath(), JSON.stringify(data));
    mainWindow.webContents.send('loadData', data);
  }
}

export default Main;

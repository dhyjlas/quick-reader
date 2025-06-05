import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const fs = require('fs')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 700,
    height: 40,
    show: false,
    frame: false,
    minHeight: 40,
    maxHeight: 40,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 处理文件选择请求
  ipcMain.handle('open-file-dialog', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'], // 打开文件对话框
        filters: [
          { name: 'Text Files', extensions: ['txt'] }, // 可选：文件类型过滤
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const content = fs.readFileSync(filePath, 'utf-8')
        return { success: true, filePath: filePath, content: content }
      } else {
        return { success: false, message: '用户取消了选择' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 监听读取文件请求
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 监听写入文件请求
  ipcMain.handle('write-file', async (event, { filePath, content }) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

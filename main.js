const { app, BrowserWindow, ipcMain, net, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { readFile } = require('fs/promises');

// const systems = require("./systems.json")
// const systems_name_array = systems.map(item => (item.name).toLowerCase())

const ipc = require('electron').ipcMain;

const homePath = app.getPath('home')
const fullPath = `${homePath}\\AppData\\Local\\CCP\\EVE\\c_eve_sharedcache_tq_tranquility\\settings_Default`

let state = false
let window

Menu.setApplicationMenu(false)

try {
  require('electron-reloader')(module)
} catch (_) { }

const createWindow = () => {
  const win = new BrowserWindow({
    width: 300,
    height: 200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
  win.webContents.send('update-switch', 1)
  // win.webContents.openDevTools()
  window = win
  // return win
}

const getPrefs = () => {
  fs.readFile(`${fullPath}\\prefs.ini`, "utf8", (error, data) => {
    const lines = data.split(/\r\n|\r|\n/)
    for (let i = 0; i < lines.length; i++) {

      if (lines[i].startsWith('bracketsAlwaysShowShipText')) {
        // console.log("bracketsAlwaysShowShipText found!")
        const value = lines[i].substring(lines[i].indexOf('=') + 1);
        console.log("bracketsAlwaysShowShipText value: ", value)
        if (value == 1) {
          state = true
          const contents = window.webContents
          contents.send('update-switch', 1)
        }
        else {
          state = false
          const contents = window.webContents
          contents.send('update-switch', 0)
        }
      }
    }

  });
  setTimeout(getPrefs, 1000);
}

const togglePrefs = async () => {
  const fileData = await readFile(`${fullPath}\\prefs.ini`, "utf8")

  if (!fileData) {
    console.log("Error reading file..")
    return
  }

  const lines = fileData.split(/\r\n|\r|\n/)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('bracketsAlwaysShowShipText')) {
      // console.log("bracketsAlwaysShowShipText found!")
      const value = lines[i].substring(lines[i].indexOf('=') + 1);
      console.log("bracketsAlwaysShowShipText value: ", value)
      if (value == 1) {
        lines[i] = lines[i].replace('1', '0')
        const contents = window.webContents
        contents.send('update-switch', 1)
      }
      else {
        lines[i] = lines[i].replace('0', '1')
        const contents = window.webContents
        contents.send('update-switch', 0)
      }
    }
  }
  // console.log("lines ", lines)

  // * Write file
  fs.writeFile(
    `${fullPath}\\prefs.ini`,
    lines.join('\n'),
    'utf8',
    (err) => {
      if (err) {
        alert("An error ocurred updating the file" + err.message)
        console.log(err)
        return
      }
    })
}

app.whenReady().then(() => {
  createWindow()

  getPrefs()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.on('update-switch', (_event, value) => {
    console.log(value) // will print value to Node console
  })

  ipcMain.on('setSwitch', (event, data) => {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)

    togglePrefs()
  })

  ipcMain.on('readFile', (event, data) => {
    console.log("reading files")

    const homeDir = app.getPath('home')
    const dirPath = `${homeDir}\\Documents\\EVE\\logs\\Chatlogs`

    // ** get unique name chats
    const allChats = getUniqueChats(dirPath)
    let uniqueChats = [...new Set(allChats)];
    // console.log(uniqueChats)

    // ** filter channels
    const filters = ["wc", "Bean"]
    let filteredChat = []

    for (let i = 0; i < filters.length; i++) {
      const arr = uniqueChats.filter(chat => String(chat).startsWith(filters[i]))
      // console.log("arr: ", arr)
      filteredChat = [...filteredChat, ...arr]
    }

    console.log('filteredChat: ', filteredChat)

    // ** scan directory for the last chatlogs (filtered)

    // const filenames = fs.readdirSync(dirPath)
    const chatToScan = []
    for (let i = 0; i < filteredChat.length; i++) {
      const files = getDirectories(dirPath, filteredChat[i]);
      const lastModified = files.sort((a, b) => b.modified - a.modified);

      // console.log(`${filteredChat[i]}\nLast modified:\n`)
      // console.log(lastModified[0])
      chatToScan.push(lastModified[0].name)
      // * build global chatLogs
      chatLogs.push({ chatName: lastModified[0].name, last: "" })
    }

    console.log("chatToScan: ", chatToScan)
    console.log("chatLogs: ", chatLogs)
    scanChats(chatToScan, dirPath);
    // scanChats(chatToScan, dirPath)

  })

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


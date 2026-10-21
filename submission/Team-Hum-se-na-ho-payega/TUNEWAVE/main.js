const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 900,
    minWidth: 900,
    minHeight: 640,
    title: "TuneWave",
    backgroundColor: "#E8EAF1",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

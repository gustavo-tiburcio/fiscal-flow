const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");

let store;

function registerIpc() {
  store = require("./database.cjs");
  ipcMain.handle("accountant:get", () => store.getAccountant());
  ipcMain.handle("accountant:save", (_e, data) => store.saveAccountant(data));
  ipcMain.handle("companies:list", () => store.listCompanies());
  ipcMain.handle("companies:create", (_e, data) => store.createCompany(data));
  ipcMain.handle("invoices:list", (_e, companyId) => store.listInvoices(companyId));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: "#ffffff",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.ELECTRON_DEV_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

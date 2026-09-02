const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

let store;

function registerIpc() {
  store = require("./database.cjs");
  ipcMain.handle("accountant:get", () => store.getAccountant());
  ipcMain.handle("accountant:save", (_e, data) => store.saveAccountant(data));
  ipcMain.handle("companies:list", () => store.listCompanies());
  ipcMain.handle("companies:create", (_e, data) => {
    validarCertificado(data);
    return store.createCompany(data);
  });
  ipcMain.handle("companies:select-certificate", async () => {
    const result = await dialog.showOpenDialog({
      title: "Selecionar certificado digital",
      properties: ["openFile"],
      filters: [{ name: "Certificado A1", extensions: ["pfx", "p12"] }],
    });

    if (result.canceled || !result.filePaths[0]) return null;
    const certificatePath = result.filePaths[0];
    return { certificatePath, certificateFileName: path.basename(certificatePath) };
  });
  ipcMain.handle("companies:update-certificate", (_e, companyId, data) => {
    validarCertificado(data);
    const company = store.updateCompanyCertificate(companyId, data);
    if (!company) throw new Error("Empresa não encontrada.");
    return company;
  });
  ipcMain.handle("invoices:list", (_e, companyId) => store.listInvoices(companyId));
  ipcMain.handle("invoices:sync", async (_e, companyId) => {
    const company = store.getCompany(companyId);
    if (!company) throw new Error("Empresa não encontrada.");

    const { consultarNFSes } = await import(
      pathToFileURL(path.join(__dirname, "services", "consultaService.js")).href
    );
    const documents = [];
    const fetched = await consultarNFSes(company, {
      onDocument: (document) => documents.push(document),
    });
    const imported = store.upsertInvoices(company.id, documents);
    return { fetched, imported };
  });
}

function validarCertificado(data) {
  if (!data?.certificatePath) {
    throw new Error("Selecione o certificado pelo seletor do aplicativo desktop.");
  }
  if (!fs.existsSync(data.certificatePath)) {
    throw new Error("O arquivo do certificado não foi encontrado no local selecionado.");
  }
  if (!data.certificatePassword) {
    throw new Error("Informe a senha do certificado digital.");
  }
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

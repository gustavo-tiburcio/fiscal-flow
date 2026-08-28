const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fiscal", {
  getAccountant: () => ipcRenderer.invoke("accountant:get"),
  saveAccountant: (data) => ipcRenderer.invoke("accountant:save", data),
  listCompanies: () => ipcRenderer.invoke("companies:list"),
  createCompany: (data) => ipcRenderer.invoke("companies:create", data),
  selectCertificate: () => ipcRenderer.invoke("companies:select-certificate"),
  updateCompanyCertificate: (companyId, data) =>
    ipcRenderer.invoke("companies:update-certificate", companyId, data),
  listInvoices: (companyId) => ipcRenderer.invoke("invoices:list", companyId),
  syncInvoices: (companyId) => ipcRenderer.invoke("invoices:sync", companyId),
});

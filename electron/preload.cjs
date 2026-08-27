const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fiscal", {
  getAccountant: () => ipcRenderer.invoke("accountant:get"),
  saveAccountant: (data) => ipcRenderer.invoke("accountant:save", data),
  listCompanies: () => ipcRenderer.invoke("companies:list"),
  createCompany: (data) => ipcRenderer.invoke("companies:create", data),
  listInvoices: (companyId) => ipcRenderer.invoke("invoices:list", companyId),
});

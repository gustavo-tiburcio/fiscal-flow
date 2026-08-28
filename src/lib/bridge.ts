/**
 * Ponte de persistência do renderer.
 *
 * Em produção (Electron) as chamadas vão para o processo principal via IPC,
 * onde o SQLite é acessado com Drizzle ORM (ver electron/database.cjs).
 * No preview web, usamos um armazenamento local equivalente para que a UI
 * funcione com a mesma API assíncrona.
 */
import type {
  Accountant,
  CertificateCredentials,
  CertificateSelection,
  Company,
  Invoice,
  InvoiceSyncResult,
  NewCompany,
} from "./domain";

type FiscalBridge = {
  getAccountant(): Promise<Accountant | null>;
  saveAccountant(data: Accountant): Promise<Accountant>;
  listCompanies(): Promise<Company[]>;
  createCompany(data: NewCompany): Promise<Company>;
  selectCertificate(): Promise<CertificateSelection | null>;
  updateCompanyCertificate(companyId: number, data: CertificateCredentials): Promise<Company>;
  listInvoices(companyId?: number): Promise<Invoice[]>;
  syncInvoices(companyId: number): Promise<InvoiceSyncResult>;
};

declare global {
  interface Window {
    fiscal?: FiscalBridge;
  }
}

const KEY = "fiscal.local.v1";

type LocalState = { accountant: Accountant | null; companies: Company[]; invoices: Invoice[] };

const empty: LocalState = { accountant: null, companies: [], invoices: [] };

function read(): LocalState {
  if (typeof window === "undefined") return empty;
  try {
    return { ...empty, ...(JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as LocalState) };
  } catch {
    return empty;
  }
}

function write(state: LocalState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

const nextId = (rows: { id: number }[]) => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;

function seedInvoices(companyId: number, cnpj: string): Invoice[] {
  const recipients = [
    "Nordeste Distribuidora ME",
    "Prefeitura de Sorocaba",
    "Vitalis Clínica Ltda",
    "Argo Logística S/A",
    "Studio Marca Digital",
  ];
  const statuses: Invoice["status"][] = [
    "authorized",
    "authorized",
    "pending",
    "authorized",
    "cancelled",
  ];
  return recipients.map((recipient, i) => ({
    id: Number(`${companyId}${i + 1}`),
    companyId,
    number: `${cnpj.slice(0, 3)}${(1200 + i * 37).toString()}`,
    issuedAt: new Date(Date.now() - (i + 1) * 86400000 * 4).toISOString(),
    recipient,
    amount: 1850.4 + i * 2734.15,
    status: statuses[i]!,
  }));
}

const local: FiscalBridge = {
  async getAccountant() {
    return read().accountant;
  },
  async saveAccountant(data) {
    const state = read();
    const accountant = { ...data, id: 1, createdAt: new Date().toISOString() };
    write({ ...state, accountant });
    return accountant;
  },
  async listCompanies() {
    return read().companies;
  },
  async createCompany(data) {
    const state = read();
    const company: Company = {
      ...data,
      id: nextId(state.companies),
      createdAt: new Date().toISOString(),
    };
    write({
      ...state,
      companies: [...state.companies, company],
      invoices: [...state.invoices, ...seedInvoices(company.id, company.cnpj)],
    });
    return company;
  },
  async selectCertificate() {
    return null;
  },
  async updateCompanyCertificate(companyId, data) {
    const state = read();
    const company = state.companies.find((item) => item.id === companyId);
    if (!company) throw new Error("Empresa não encontrada.");
    const updated = { ...company, ...data };
    write({
      ...state,
      companies: state.companies.map((item) => (item.id === companyId ? updated : item)),
    });
    return updated;
  },
  async listInvoices(companyId) {
    const invoices = read().invoices;
    return companyId ? invoices.filter((i) => i.companyId === companyId) : invoices;
  },
  async syncInvoices() {
    throw new Error("A importação de NFS-e está disponível somente no aplicativo desktop.");
  },
};

export const db: FiscalBridge = {
  getAccountant: () => (window.fiscal ?? local).getAccountant(),
  saveAccountant: (d) => (window.fiscal ?? local).saveAccountant(d),
  listCompanies: () => (window.fiscal ?? local).listCompanies(),
  createCompany: (d) => (window.fiscal ?? local).createCompany(d),
  selectCertificate: () => (window.fiscal ?? local).selectCertificate(),
  updateCompanyCertificate: (id, d) => {
    const electronBridge = window.fiscal;
    if (electronBridge && typeof electronBridge.updateCompanyCertificate !== "function") {
      return Promise.reject(
        new Error("Reinicie o aplicativo desktop para carregar a atualização do certificado."),
      );
    }
    return (electronBridge ?? local).updateCompanyCertificate(id, d);
  },
  listInvoices: (id) => (window.fiscal ?? local).listInvoices(id),
  syncInvoices: (id) => (window.fiscal ?? local).syncInvoices(id),
};

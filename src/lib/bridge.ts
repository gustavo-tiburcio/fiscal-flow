/**
 * Ponte de persistência do renderer.
 *
 * Em produção (Electron) as chamadas vão para o processo principal via IPC,
 * onde o SQLite é acessado com Drizzle ORM (ver electron/database.cjs).
 * No preview web, usamos um armazenamento local equivalente para que a UI
 * funcione com a mesma API assíncrona.
 */
import type { Accountant, Company, Invoice, NewCompany } from "./domain";

type FiscalBridge = {
  getAccountant(): Promise<Accountant | null>;
  saveAccountant(data: Accountant): Promise<Accountant>;
  listCompanies(): Promise<Company[]>;
  createCompany(data: NewCompany): Promise<Company>;
  listInvoices(companyId?: number): Promise<Invoice[]>;
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
  const statuses: Invoice["status"][] = ["authorized", "authorized", "pending", "authorized", "cancelled"];
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
    const company: Company = { ...data, id: nextId(state.companies), createdAt: new Date().toISOString() };
    write({
      ...state,
      companies: [...state.companies, company],
      invoices: [...state.invoices, ...seedInvoices(company.id, company.cnpj)],
    });
    return company;
  },
  async listInvoices(companyId) {
    const invoices = read().invoices;
    return companyId ? invoices.filter((i) => i.companyId === companyId) : invoices;
  },
};

export const db: FiscalBridge = {
  getAccountant: () => (window.fiscal ?? local).getAccountant(),
  saveAccountant: (d) => (window.fiscal ?? local).saveAccountant(d),
  listCompanies: () => (window.fiscal ?? local).listCompanies(),
  createCompany: (d) => (window.fiscal ?? local).createCompany(d),
  listInvoices: (id) => (window.fiscal ?? local).listInvoices(id),
};

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Building2, FileText, Plus, Search, TrendingUp, Wallet } from "lucide-react";
import { AddCompanyModal } from "./AddCompanyModal";
import { db } from "@/lib/bridge";
import {
  brl,
  shortDate,
  statusLabel,
  type Accountant,
  type Company,
  type Invoice,
  type NewCompany,
} from "@/lib/domain";

const statusTone: Record<Invoice["status"], string> = {
  authorized: "text-success",
  pending: "text-warning",
  cancelled: "text-destructive",
};

export function Dashboard({ accountant }: { accountant: Accountant }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      setCompanies(await db.listCompanies());
      setInvoices(await db.listInvoices());
    })();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-shell]",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 },
      );
    }, shell);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-card]",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 },
      );
    }, main);
    return () => ctx.revert();
  }, [selected, companies.length]);

  const company = companies.find((c) => c.id === selected) ?? null;
  const scoped = useMemo(
    () => (company ? invoices.filter((i) => i.companyId === company.id) : invoices),
    [company, invoices],
  );
  const filtered = useMemo(
    () =>
      scoped.filter((i) =>
        `${i.number} ${i.recipient}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [scoped, query],
  );

  const total = scoped.reduce((sum, i) => sum + (i.status === "cancelled" ? 0 : i.amount), 0);
  const pending = scoped.filter((i) => i.status === "pending").length;

  const createCompany = async (data: NewCompany) => {
    const created = await db.createCompany(data);
    setCompanies((prev) => [created, ...prev]);
    setInvoices(await db.listInvoices());
    setSelected(created.id);
  };

  const metrics = [
    { label: "Notas emitidas", value: String(scoped.length), icon: FileText },
    { label: "Valor acumulado", value: brl(total), icon: Wallet },
    { label: "Pendentes de autorização", value: String(pending), icon: TrendingUp },
    { label: "Empresas ativas", value: String(companies.length), icon: Building2 },
  ];

  return (
    <div ref={shell} className="flex min-h-screen bg-surface">
      <aside
        data-shell
        className="flex w-[270px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
      >
        <div className="px-6 py-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            AGNF-E
          </p>
          <p className="mt-3 text-sm font-semibold text-sidebar-foreground">{accountant.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{accountant.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <button
            onClick={() => setSelected(null)}
            className={`mb-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              selected === null
                ? "bg-sidebar-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <TrendingUp className="size-4" />
            Visão geral
          </button>

          <p className="mt-6 px-3 field-label">Empresas ({companies.length})</p>
          <div className="mt-2 space-y-0.5">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`block w-full rounded-md px-3 py-2 text-left transition-colors ${
                  selected === c.id
                    ? "bg-sidebar-accent text-accent-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="tabular block text-[11px] text-muted-foreground">{c.cnpj}</span>
              </button>
            ))}
            {companies.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Nenhuma empresa cadastrada ainda.
              </p>
            )}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Adicionar Empresa
          </button>
        </div>
      </aside>

      <main data-shell className="flex-1 overflow-x-hidden">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-background px-10 py-7">
          <div>
            <p className="field-label">{company ? "Empresa" : "Painel geral"}</p>
            <h1 className="mt-1.5 text-2xl font-semibold">
              {company ? company.name : "Gestão de notas fiscais"}
            </h1>
            <p className="tabular mt-1 text-sm text-muted-foreground">
              {company
                ? `CNPJ ${company.cnpj} · certificado ${company.certificateFileName}`
                : "Consolidado de todas as empresas do escritório"}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-box w-64 pl-9"
              value={query}
              placeholder="Buscar nota ou destinatário"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </header>

        <div ref={main} className="space-y-8 px-10 py-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((m) => (
              <div data-card key={m.label} className="panel px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="field-label">{m.label}</span>
                  <m.icon className="size-4 text-muted-foreground" />
                </div>
                <p className="tabular mt-3 text-2xl font-semibold">{m.value}</p>
              </div>
            ))}
          </section>

          <section data-card className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Notas fiscais</h2>
              <span className="tabular text-xs text-muted-foreground">
                {filtered.length} registro(s)
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-sm font-medium">Nenhuma nota para exibir</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {companies.length === 0
                    ? "Cadastre a primeira empresa para começar a importar notas."
                    : "Ajuste a busca ou selecione outra empresa."}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Número", "Emissão", "Destinatário", "Valor", "Situação"].map((h) => (
                      <th key={h} className="field-label px-5 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-surface">
                      <td className="tabular px-5 py-3 font-medium">{invoice.number}</td>
                      <td className="tabular px-5 py-3 text-muted-foreground">
                        {shortDate(invoice.issuedAt)}
                      </td>
                      <td className="px-5 py-3">{invoice.recipient}</td>
                      <td className="tabular px-5 py-3">{brl(invoice.amount)}</td>
                      <td className={`px-5 py-3 font-medium ${statusTone[invoice.status]}`}>
                        {statusLabel[invoice.status]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>

      <AddCompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createCompany}
      />
    </div>
  );
}

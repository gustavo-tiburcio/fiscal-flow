import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  Building2,
  CalendarClock,
  FileText,
  KeyRound,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { AddCompanyModal } from "./AddCompanyModal";
import { SettingsModal } from "./SettingsModal";
import { InvoiceAnalytics } from "./InvoiceAnalytics";
import { db } from "@/lib/bridge";
import { usePreferences } from "@/lib/theme";
import {
  brl,
  shortDate,
  statusLabel,
  type Accountant,
  type CertificateCredentials,
  type Company,
  type Invoice,
  type InvoiceStatus,
  type NewCompany,
} from "@/lib/domain";

const statusTone: Record<Invoice["status"], string> = {
  authorized: "text-success",
  pending: "text-warning",
  cancelled: "text-destructive",
};

type StatusFilter = InvoiceStatus | "all";
type PeriodFilter = "all" | "30" | "90" | "365";
type SortFilter = "recent" | "oldest" | "highest" | "lowest";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "authorized", label: "Autorizadas" },
  { value: "pending", label: "Pendentes" },
  { value: "cancelled", label: "Canceladas" },
];

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Todo o período" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Últimos 12 meses" },
];

const sortOptions: { value: SortFilter; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigas" },
  { value: "highest", label: "Maior valor" },
  { value: "lowest", label: "Menor valor" },
];

export function Dashboard({ accountant }: { accountant: Accountant }) {
  const prefs = usePreferences();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [minAmount, setMinAmount] = useState("");
  const [sort, setSort] = useState<SortFilter>("recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLDivElement>(null);

  const collapsed = prefs.hoverExpand && !sidebarHovered;
  const sidebarWidth = collapsed ? 68 : prefs.sidebarWidth;

  useEffect(() => {
    void (async () => {
      setCompanies(await db.listCompanies());
      setInvoices(await db.listInvoices());
    })();
  }, []);

  useEffect(() => {
    if (!prefs.animations) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-shell]",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 },
      );
    }, shell);
    return () => ctx.revert();
  }, [prefs.animations]);

  useEffect(() => {
    if (!prefs.animations) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-card]",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 },
      );
    }, main);
    return () => ctx.revert();
  }, [selected, companies.length, prefs.animations]);

  const company = companies.find((c) => c.id === selected) ?? null;
  const scoped = useMemo(
    () => (company ? invoices.filter((i) => i.companyId === company.id) : invoices),
    [company, invoices],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const min = Number(minAmount.replace(",", ".")) || 0;
    const limit = period === "all" ? 0 : Date.now() - Number(period) * 86400000;
    const rows = scoped.filter((i) => {
      if (term && !`${i.number} ${i.recipient}`.toLowerCase().includes(term)) return false;
      if (status !== "all" && i.status !== status) return false;
      if (min && i.amount < min) return false;
      if (limit && new Date(i.issuedAt).getTime() < limit) return false;
      return true;
    });
    return rows.sort((a, b) => {
      if (sort === "highest") return b.amount - a.amount;
      if (sort === "lowest") return a.amount - b.amount;
      const delta = new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      return sort === "oldest" ? -delta : delta;
    });
  }, [scoped, query, status, minAmount, period, sort]);

  const stats = useMemo(() => {
    const valid = filtered.filter((i) => i.status !== "cancelled");
    const total = valid.reduce((sum, i) => sum + i.amount, 0);
    const last = filtered.reduce<Invoice | null>(
      (latest, i) =>
        !latest || new Date(i.issuedAt) > new Date(latest.issuedAt) ? i : latest,
      null,
    );
    return {
      total,
      count: filtered.length,
      pending: filtered.filter((i) => i.status === "pending").length,
      cancelled: filtered.filter((i) => i.status === "cancelled").length,
      average: valid.length ? total / valid.length : 0,
      last,
    };
  }, [filtered]);

  const activeFilters =
    (status !== "all" ? 1 : 0) + (period !== "all" ? 1 : 0) + (minAmount ? 1 : 0) + (query ? 1 : 0);

  const createCompany = async (data: NewCompany) => {
    const created = await db.createCompany(data);
    setCompanies((prev) => [created, ...prev]);
    setInvoices(await db.listInvoices());
    setSelected(created.id);
  };

  const syncInvoices = async () => {
    if (!company) return;
    setSyncing(true);
    setSyncMessage(null);
    setSyncError(false);
    try {
      const result = await db.syncInvoices(company.id);
      setInvoices(await db.listInvoices());
      setSyncMessage(
        result.imported
          ? `${result.imported} NFS-e importada(s) e salva(s) localmente.`
          : "Nenhuma NFS-e nova foi encontrada.",
      );
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Não foi possível consultar as NFS-e.";
      setSyncMessage(message);
      setSyncError(true);
      if (message.includes("Selecione novamente o certificado")) {
        setCertificateModalOpen(true);
      }
    } finally {
      setSyncing(false);
    }
  };

  const updateCertificate = async (data: CertificateCredentials) => {
    if (!company) return;
    const updated = await db.updateCompanyCertificate(company.id, data);
    setCompanies((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    setSyncError(false);
    setSyncMessage("Certificado digital atualizado. Você já pode consultar as NFS-e.");
  };

  const metrics = [
    { label: "Notas no filtro", value: String(stats.count), icon: FileText },
    { label: "Valor acumulado", value: brl(stats.total), icon: Wallet },
    { label: "Ticket médio", value: brl(stats.average), icon: Receipt },
    { label: "Pendentes", value: String(stats.pending), icon: TrendingUp },
    { label: "Canceladas", value: String(stats.cancelled), icon: XCircle },
    {
      label: company ? "Última emissão" : "Empresas ativas",
      value: company
        ? stats.last
          ? shortDate(stats.last.issuedAt)
          : "—"
        : String(companies.length),
      icon: company ? CalendarClock : Building2,
    },
  ];

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setPeriod("all");
    setMinAmount("");
    setSort("recent");
  };

  return (
    <div ref={shell} className="flex min-h-screen bg-surface">
      <aside
        data-shell
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        style={{ width: sidebarWidth }}
        className="relative flex shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out"
      >
        <div className="px-5 py-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {collapsed ? "AG" : "AGNF-E"}
          </p>
          {!collapsed && (
            <>
              <p className="mt-3 truncate text-sm font-semibold text-sidebar-foreground">
                {accountant.fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{accountant.email}</p>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <button
            onClick={() => setSelected(null)}
            title="Visão geral"
            className={`mb-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              selected === null
                ? "bg-sidebar-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <TrendingUp className="size-4 shrink-0" />
            {!collapsed && "Visão geral"}
          </button>

          {!collapsed && <p className="mt-6 px-3 field-label">Empresas ({companies.length})</p>}
          <div className="mt-2 space-y-0.5">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                title={c.name}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors ${
                  selected === c.id
                    ? "bg-sidebar-accent text-accent-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                {!collapsed && (
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="tabular block text-[11px] text-muted-foreground">{c.cnpj}</span>
                  </span>
                )}
              </button>
            ))}
            {companies.length === 0 && !collapsed && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Nenhuma empresa cadastrada ainda.
              </p>
            )}
          </div>
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <button
            onClick={() => setModalOpen(true)}
            title="Adicionar empresa"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4 shrink-0" />
            {!collapsed && "Adicionar Empresa"}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Configurações"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && "Configurações"}
          </button>
        </div>
      </aside>

      <main data-shell className="min-w-0 flex-1 overflow-x-hidden">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-background px-10 py-7">
          <div>
            <p className="field-label">{company ? "Empresa" : "Painel geral"}</p>
            <h1 className="mt-1.5 text-2xl font-semibold">
              {company ? company.name : "Gestão de notas fiscais"}
            </h1>
            <p className="tabular mt-1 text-sm text-muted-foreground">
              {company
                ? `CNPJ ${company.cnpj} · certificado ${company.certificateFileName}`
                : `Consolidado de ${companies.length} empresa(s) do escritório`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {company && (
              <>
                <button
                  onClick={() => setCertificateModalOpen(true)}
                  className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  <KeyRound className="size-4" />
                  Certificado
                </button>
                <button
                  onClick={() => void syncInvoices()}
                  disabled={syncing}
                  className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Consultando…" : "Atualizar NFS-e"}
                </button>
              </>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Configurações"
              className="flex size-10 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-secondary"
            >
              <Settings className="size-4" />
            </button>
          </div>
        </header>

        <div ref={main} className="space-y-6 px-10 py-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {metrics.map((m) => (
              <div data-card key={m.label} className="panel px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="field-label">{m.label}</span>
                  <m.icon className="size-4 text-muted-foreground" />
                </div>
                <p className="tabular mt-3 text-xl font-semibold">{m.value}</p>
              </div>
            ))}
          </section>

          <InvoiceAnalytics invoices={filtered} />

          <section data-card className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Notas fiscais</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="input-box w-56 pl-9"
                    value={query}
                    placeholder="Buscar nota ou destinatário"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select
                  className="input-box w-40"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  className="input-box w-44"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                >
                  {periodOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  className="input-box w-32"
                  value={minAmount}
                  inputMode="decimal"
                  placeholder="Valor mín."
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <select
                  className="input-box w-40"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortFilter)}
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {activeFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    Limpar ({activeFilters})
                  </button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-sm font-medium">Nenhuma nota para exibir</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {companies.length === 0
                    ? "Cadastre a primeira empresa para começar a importar notas."
                    : "Ajuste os filtros ou selecione outra empresa."}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {[
                      "Número",
                      "Emissão",
                      "Destinatário",
                      "Competência",
                      "Valor",
                      "Situação",
                    ].map((h) => (
                      <th key={h} className="field-label px-5 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border last:border-0 hover:bg-surface"
                    >
                      <td className="tabular px-5 py-3 font-medium">{invoice.number}</td>
                      <td className="tabular px-5 py-3 text-muted-foreground">
                        {shortDate(invoice.issuedAt)}
                      </td>
                      <td className="px-5 py-3">{invoice.recipient}</td>
                      <td className="tabular px-5 py-3 text-muted-foreground">
                        {invoice.competencia
                          ? invoice.competencia
                          : new Date(invoice.issuedAt).toLocaleDateString("pt-BR", {
                              month: "2-digit",
                              year: "numeric",
                            })}
                      </td>
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

          {syncMessage && (
            <p
              role="status"
              className={`text-sm ${syncError ? "text-destructive" : "text-success"}`}
            >
              {syncMessage}
            </p>
          )}
        </div>
      </main>

      <AddCompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createCompany}
      />
      {company && (
        <AddCompanyModal
          open={certificateModalOpen}
          onClose={() => setCertificateModalOpen(false)}
          onCreate={createCompany}
          company={company}
          onUpdateCertificate={updateCertificate}
        />
      )}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        accountant={accountant}
        companies={companies.length}
        invoices={invoices.length}
      />
    </div>
  );
}

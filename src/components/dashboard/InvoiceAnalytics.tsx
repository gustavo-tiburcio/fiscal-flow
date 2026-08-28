import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl, statusLabel, type Invoice } from "@/lib/domain";

const monthKey = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

const statusColor: Record<Invoice["status"], string> = {
  authorized: "var(--success)",
  pending: "var(--warning)",
  cancelled: "var(--destructive)",
};

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-card className="panel px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <span className="tabular text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-4 h-52">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

export function InvoiceAnalytics({ invoices }: { invoices: Invoice[] }) {
  const byMonth = useMemo(() => {
    const map = new Map<string, { month: string; valor: number; notas: number; time: number }>();
    for (const invoice of invoices) {
      if (invoice.status === "cancelled") continue;
      const key = monthKey(invoice.issuedAt);
      const date = new Date(invoice.issuedAt);
      const bucket = map.get(key) ?? {
        month: key,
        valor: 0,
        notas: 0,
        time: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
      };
      bucket.valor += invoice.amount;
      bucket.notas += 1;
      map.set(key, bucket);
    }
    return [...map.values()].sort((a, b) => a.time - b.time).slice(-12);
  }, [invoices]);

  const byStatus = useMemo(() => {
    const order: Invoice["status"][] = ["authorized", "pending", "cancelled"];
    return order
      .map((status) => ({
        status,
        name: statusLabel[status],
        value: invoices.filter((i) => i.status === status).length,
      }))
      .filter((row) => row.value > 0);
  }, [invoices]);

  const topRecipients = useMemo(() => {
    const map = new Map<string, number>();
    for (const invoice of invoices) {
      if (invoice.status === "cancelled") continue;
      map.set(invoice.recipient, (map.get(invoice.recipient) ?? 0) + invoice.amount);
    }
    return [...map.entries()]
      .map(([recipient, valor]) => ({ recipient, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [invoices]);

  if (invoices.length === 0) return null;

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <ChartCard title="Faturamento por competência" hint={`${byMonth.length} mês(es)`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={byMonth} margin={{ left: -18, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="fillValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => `R$ ${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [brl(value), "Faturado"]}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#fillValor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Situação das notas" hint={`${invoices.length} nota(s)`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72}>
              {byStatus.map((row) => (
                <Cell key={row.status} fill={statusColor[row.status]} stroke="var(--card)" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="xl:col-span-3">
        <ChartCard title="Principais destinatários" hint="por valor faturado">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRecipients} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="recipient"
                width={180}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [brl(value), "Faturado"]}
              />
              <Bar dataKey="valor" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

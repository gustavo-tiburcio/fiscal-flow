import { Monitor, Moon, RotateCcw, Sun, X } from "lucide-react";
import { usePreferences, type Density, type ThemeMode } from "@/lib/theme";
import type { Accountant } from "@/lib/domain";

const modes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

const densities: { value: Density; label: string }[] = [
  { value: "confortavel", label: "Confortável" },
  { value: "compacto", label: "Compacto" },
];

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsModal({
  open,
  onClose,
  accountant,
  companies,
  invoices,
}: {
  open: boolean;
  onClose: () => void;
  accountant: Accountant;
  companies: number;
  invoices: number;
}) {
  const prefs = usePreferences();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4">
      <div className="panel w-full max-w-xl shadow-[var(--shadow-overlay)]">
        <header className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="field-label">Configurações</p>
            <h2 className="mt-1 text-lg font-semibold">Preferências do aplicativo</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar configurações"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-2">
          <p className="field-label mt-4">Geral</p>
          <Row title="Contador" description={accountant.email}>
            <span className="text-sm text-muted-foreground">{accountant.fullName}</span>
          </Row>
          <Row title="Dados locais" description="Empresas e notas armazenadas neste computador">
            <span className="tabular text-sm text-muted-foreground">
              {companies} empresa(s) · {invoices} nota(s)
            </span>
          </Row>

          <p className="field-label mt-6">Aparência</p>
          <Row title="Tema" description="Escolha entre claro, escuro ou seguir o sistema">
            <div className="flex gap-1 rounded-md border border-border p-1">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => prefs.set("mode", m.value)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    prefs.mode === m.value
                      ? "bg-sidebar-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <m.icon className="size-3.5" />
                  {m.label}
                </button>
              ))}
            </div>
          </Row>
          <Row title="Densidade" description="Espaçamento das listas e tabelas">
            <div className="flex gap-1 rounded-md border border-border p-1">
              {densities.map((d) => (
                <button
                  key={d.value}
                  onClick={() => prefs.set("density", d.value)}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    prefs.density === d.value
                      ? "bg-sidebar-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Row>
          <Row title="Animações" description="Transições de entrada com GSAP">
            <button
              onClick={() => prefs.set("animations", !prefs.animations)}
              role="switch"
              aria-checked={prefs.animations}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                prefs.animations ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${
                  prefs.animations ? "left-[1.15rem]" : "left-0.5"
                }`}
              />
            </button>
          </Row>

          <p className="field-label mt-6">Barra lateral</p>
          <Row title="Expandir ao passar o mouse" description="Recolhe automaticamente ao sair">
            <button
              onClick={() => prefs.set("hoverExpand", !prefs.hoverExpand)}
              role="switch"
              aria-checked={prefs.hoverExpand}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                prefs.hoverExpand ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${
                  prefs.hoverExpand ? "left-[1.15rem]" : "left-0.5"
                }`}
              />
            </button>
          </Row>
          <Row title="Largura expandida" description={`${prefs.sidebarWidth}px`}>
            <input
              type="range"
              min={220}
              max={360}
              step={10}
              value={prefs.sidebarWidth}
              onChange={(e) => prefs.set("sidebarWidth", Number(e.target.value))}
              className="w-40 accent-[var(--primary)]"
            />
          </Row>
        </div>

        <footer className="flex justify-between border-t border-border px-6 py-4">
          <button
            onClick={prefs.reset}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <RotateCcw className="size-4" />
            Restaurar padrões
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Concluir
          </button>
        </footer>
      </div>
    </div>
  );
}

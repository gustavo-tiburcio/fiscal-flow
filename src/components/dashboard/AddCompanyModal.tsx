import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Eye, EyeOff, FileCheck2, ShieldCheck, UploadCloud, X } from "lucide-react";
import { isValidCnpj, maskCnpj, type NewCompany } from "@/lib/domain";

export function AddCompanyModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: NewCompany) => Promise<void>;
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [file, setFile] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const ctx = gsap.context(() => {
      gsap.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
      gsap.fromTo(
        card.current,
        { opacity: 0, y: 24, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" },
      );
      gsap.fromTo(
        card.current!.querySelectorAll("[data-row]"),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.06, delay: 0.08 },
      );
    });
    return () => ctx.revert();
  }, [open]);

  if (!open) return null;

  const pick = (list: FileList | null) => {
    const picked = list?.[0];
    if (!picked) return;
    if (!/\.(pfx|p12)$/i.test(picked.name)) {
      setError("O certificado precisa ser um arquivo .pfx ou .p12.");
      return;
    }
    setError(null);
    setFile(picked.name);
  };

  const submit = async () => {
    if (!name.trim()) return setError("Informe a razão social da empresa.");
    if (!isValidCnpj(cnpj)) return setError("O CNPJ deve conter 14 dígitos.");
    if (!file) return setError("Anexe o certificado digital (.pfx ou .p12).");
    if (password.length < 4) return setError("Informe a senha do certificado.");
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        cnpj,
        certificateFileName: file,
        certificatePassword: password,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-6 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        className="panel w-full max-w-lg shadow-overlay"
      >
        <div className="flex items-start justify-between border-b border-border px-7 py-5">
          <div>
            <p className="field-label">Cadastro</p>
            <h2 className="mt-1 text-lg font-semibold">Adicionar empresa</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          <div data-row>
            <label className="field-label" htmlFor="company-name">
              Razão social
            </label>
            <input
              id="company-name"
              className="input-box mt-2"
              value={name}
              placeholder="Ex.: Ribeiro Comércio de Alimentos Ltda"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div data-row>
            <label className="field-label" htmlFor="company-cnpj">
              CNPJ
            </label>
            <input
              id="company-cnpj"
              className="input-box tabular mt-2"
              value={cnpj}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              onChange={(e) => setCnpj(maskCnpj(e.target.value))}
            />
          </div>

          <div data-row>
            <span className="field-label">Certificado digital</span>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pick(e.dataTransfer.files);
              }}
              onClick={() => fileInput.current?.click()}
              className={`mt-2 cursor-pointer rounded-md border border-dashed px-5 py-7 text-center transition-colors ${
                dragging ? "border-primary bg-accent" : "border-border-strong bg-surface hover:bg-secondary"
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  <FileCheck2 className="size-4 text-success" />
                  {file}
                </div>
              ) : (
                <>
                  <UploadCloud className="mx-auto size-5 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Arraste o arquivo A1 aqui</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ou clique para selecionar · .pfx ou .p12
                  </p>
                </>
              )}
              <input
                ref={fileInput}
                type="file"
                accept=".pfx,.p12"
                className="hidden"
                onChange={(e) => pick(e.target.files)}
              />
            </div>
          </div>

          <div data-row>
            <label className="field-label" htmlFor="cert-password">
              Senha do certificado
            </label>
            <div className="relative mt-2">
              <input
                id="cert-password"
                className="input-box pr-10"
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <p data-row className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Os dados são gravados apenas neste computador (SQLite local).
          </p>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-7 py-5">
          <button
            onClick={onClose}
            className="h-10 rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar empresa"}
          </button>
        </div>
      </div>
    </div>
  );
}

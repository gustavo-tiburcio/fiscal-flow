import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { db } from "@/lib/bridge";
import { isValidCpf, maskCpf, type Accountant } from "@/lib/domain";
import { ArrowRight, CheckCircle2, ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/lib/theme";
import welcomeDesk from "@/assets/welcome-desk.jpg";

type StepKey = "intro" | "fullName" | "email" | "cpf";

const steps: {
  key: StepKey;
  eyebrow: string;
  question: string;
  hint?: string;
  placeholder?: string;
  type?: string;
}[] = [
  {
    key: "intro",
    eyebrow: "Bem-vindo",
    question: "Bem-vindo ao AGNF-E.",
    hint: "Tudo em ordem. Desde o primeiro passo.",
  },
  {
    key: "fullName",
    eyebrow: "Passo 1 de 3",
    question: "Qual é o seu nome completo?",
    placeholder: "Ex.: Marina Alves Ribeiro",
  },
  {
    key: "email",
    eyebrow: "Passo 2 de 3",
    question: "E o seu melhor e-mail?",
    placeholder: "marina@escritorio.com.br",
    type: "email",
  },
  {
    key: "cpf",
    eyebrow: "Passo 3 de 3",
    question: "Para finalizar, qual é o seu CPF?",
    placeholder: "000.000.000-00",
  },
];

export function Onboarding({ onDone }: { onDone: (accountant: Accountant) => void }) {
  const prefs = usePreferences();
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState({ fullName: "", email: "", cpf: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const screenRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  const step = steps[index] ?? steps[0];
  const cpfValid = isValidCpf(values.cpf);

  useEffect(() => {
    inputRef.current?.focus();
    if (!prefs.animations || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-anim]",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.65, ease: "power3.out", stagger: 0.11 },
      );
      gsap.fromTo(
        "[data-progress]",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.7, ease: "power2.out", transformOrigin: "left center" },
      );
    }, stageRef);
    inputRef.current?.focus();
    return () => ctx.revert();
  }, [index, prefs.animations]);

  const advance = useCallback((next: () => void) => {
    if (busy.current) return;
    const stage = stageRef.current;
    if (!stage || !prefs.animations || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      next();
      return;
    }
    busy.current = true;
    gsap.to(stage.querySelectorAll("[data-anim]"), {
      opacity: 0,
      y: -14,
      duration: 0.35,
      ease: "power2.in",
      stagger: 0.05,
      onComplete: () => {
        busy.current = false;
        next();
      },
    });
  }, [prefs.animations]);

  const finish = useCallback(async () => {
    setSaving(true);
    try {
    const accountant = await db.saveAccountant({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      cpf: values.cpf,
    });
    if (!prefs.animations || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone(accountant);
      return;
    }
    gsap.to(screenRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => onDone(accountant),
    });
    } catch {
      setSaving(false);
      setError("Não foi possível salvar seus dados. Tente novamente.");
      gsap.set(stageRef.current?.querySelectorAll("[data-anim]") ?? [], { opacity: 1, y: 0 });
    }
  }, [onDone, values, prefs.animations]);

  const submit = () => {
    if (saving || busy.current) return;
    setError(null);
    if (step.key === "intro") return advance(() => setIndex(1));
    if (step.key === "fullName") {
      if (values.fullName.trim().split(" ").filter(Boolean).length < 2)
        return setError("Informe nome e sobrenome.");
      return advance(() => setIndex(2));
    }
    if (step.key === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
        return setError("Digite um e-mail válido.");
      return advance(() => setIndex(3));
    }
    if (!cpfValid) return setError("CPF inválido. Confira os 11 dígitos informados.");
    return advance(finish);
  };

  const currentValue = step.key === "intro" ? "" : values[step.key];

  return (
    <div ref={screenRef} className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background">
      {step.key === "intro" && (
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <img src={welcomeDesk} width={1536} height={1024} alt="" className="h-full w-full object-cover opacity-30 dark:opacity-10" />
        </div>
      )}
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10 sm:py-8">
        <span className="font-mono text-sm font-semibold text-primary">
          AGNF-E
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {index === 0 ? "SEU ESPAÇO FISCAL" : `${String(index).padStart(2, "0")} / 03`}
        </span>
      </header>

      <div className="flex flex-1 items-center px-6 py-8 sm:px-10 sm:pb-16">
        <div ref={stageRef} className="mx-auto w-full max-w-xl">
          <p data-anim className="field-label">
            {step.eyebrow}
          </p>
          <h1 data-anim className="mt-4 text-4xl leading-tight font-semibold text-foreground sm:text-5xl">
            {step.question}
          </h1>

          {step.hint && (
            <p data-anim className="mt-4 text-[0.95rem] text-muted-foreground">
              {step.hint}
            </p>
          )}

          {step.key !== "intro" && (
            <div data-anim className="mt-12">
              <input
                ref={inputRef}
                className="input-line"
                type={step.type ?? "text"}
                aria-label={step.question}
                aria-invalid={Boolean(error) || (step.key === "cpf" && values.cpf.length === 14 && !cpfValid)}
                aria-describedby="onboarding-feedback"
                inputMode={step.key === "cpf" ? "numeric" : step.key === "email" ? "email" : "text"}
                value={currentValue}
                placeholder={step.placeholder}
                autoComplete="off"
                onChange={(e) => {
                  const raw = e.target.value;
                  setError(null);
                  setValues((v) => ({
                    ...v,
                    [step.key]: step.key === "cpf" ? maskCpf(raw) : raw.slice(0, 120),
                  }));
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <div id="onboarding-feedback" aria-live="polite" className="mt-3 min-h-10">
                {error ? <p className="text-sm text-destructive">{error}</p> : step.key === "cpf" && cpfValid ? (
                  <p className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" />CPF válido · dígitos verificados</p>
                ) : step.key === "cpf" ? (
                  <p className={`text-xs ${values.cpf.length === 14 ? "text-destructive" : "text-muted-foreground"}`}>
                    {values.cpf.length === 14 ? "CPF inválido. Confira os dígitos informados." : "Validação dos dígitos, sem consulta à Receita Federal."}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <div data-anim className="mt-10 flex items-center gap-5">
            <Button
              onClick={submit}
              disabled={saving}
              className="h-11 gap-3 px-6"
            >
              {step.key === "intro" ? "Começar" : step.key === "cpf" ? (saving ? "Salvando…" : "Concluir") : "Próximo"}
              <ArrowRight className="size-4" />
            </Button>
            {index > 1 && (
              <Button variant="ghost" disabled={saving}
                onClick={() => advance(() => setIndex((i) => i - 1))}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Voltar
              </Button>
            )}
          </div>

          <div className="mt-12 h-px w-full bg-border">
            <div
              data-progress
              className="h-px bg-primary"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-5 text-xs text-muted-foreground sm:px-10">
        <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Seus dados ficam neste computador.</span>
        <span>Gestão fiscal · AGNF-E</span>
      </footer>
    </div>
  );
}

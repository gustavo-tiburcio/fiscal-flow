import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { db } from "@/lib/bridge";
import { isValidCpf, maskCpf, type Accountant } from "@/lib/domain";

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
    question: "Olá. Vamos começar?",
    hint: "Leva menos de um minuto.",
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
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState({ fullName: "", email: "", cpf: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const screenRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  const step = steps[index]!;

  useEffect(() => {
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
  }, [index]);

  const advance = useCallback((next: () => void) => {
    if (busy.current) return;
    busy.current = true;
    gsap.to(stageRef.current!.querySelectorAll("[data-anim]"), {
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
  }, []);

  const finish = useCallback(async () => {
    setSaving(true);
    const accountant = await db.saveAccountant({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      cpf: values.cpf,
    });
    gsap.to(screenRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => onDone(accountant),
    });
  }, [onDone, values]);

  const submit = () => {
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
    if (!isValidCpf(values.cpf)) return setError("O CPF deve conter 11 dígitos.");
    return advance(finish);
  };

  const currentValue = step.key === "intro" ? "" : values[step.key];

  return (
    <div ref={screenRef} className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-10 py-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          AGNF-E
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {String(Math.max(index, 1)).padStart(2, "0")} / 03
        </span>
      </header>

      <div className="flex flex-1 items-center px-10 pb-24">
        <div ref={stageRef} className="mx-auto w-full max-w-xl">
          <p data-anim className="field-label">
            {step.eyebrow}
          </p>
          <h1 data-anim className="mt-4 text-[2.6rem] leading-[1.08] font-semibold text-foreground">
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
                value={currentValue}
                placeholder={step.placeholder}
                autoComplete="off"
                onChange={(e) => {
                  const raw = e.target.value;
                  setValues((v) => ({
                    ...v,
                    [step.key]: step.key === "cpf" ? maskCpf(raw) : raw.slice(0, 120),
                  }));
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <div className="mt-3 h-4">
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>
          )}

          <div data-anim className="mt-10 flex items-center gap-5">
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex h-11 items-center gap-3 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {step.key === "cpf" ? (saving ? "Salvando…" : "Concluir") : "Próximo"}
              <span aria-hidden className="font-mono text-xs opacity-70">
                ↵
              </span>
            </button>
            {index > 1 && (
              <button
                onClick={() => advance(() => setIndex((i) => i - 1))}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Voltar
              </button>
            )}
          </div>

          <div className="mt-16 h-px w-full bg-border">
            <div
              data-progress
              className="h-px bg-primary"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

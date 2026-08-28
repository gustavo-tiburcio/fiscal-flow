import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { db } from "@/lib/bridge";
import { PreferencesProvider } from "@/lib/theme";
import type { Accountant } from "@/lib/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Notafiscal — Gestão de notas fiscais para contadores" },
      {
        name: "description",
        content:
          "Aplicativo desktop para contadores: cadastre empresas, certificados digitais A1 e acompanhe notas fiscais com dados salvos localmente.",
      },
      { property: "og:title", content: "Notafiscal — Gestão de notas fiscais para contadores" },
      {
        property: "og:description",
        content:
          "Onboarding rápido, painel de métricas e cadastro de empresas com certificado digital, tudo salvo no seu computador.",
      },
    ],
  }),
  component: App,
});

function App() {
  const [accountant, setAccountant] = useState<Accountant | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      setAccountant(await db.getAccountant());
      setReady(true);
    })();
  }, []);

  return (
    <PreferencesProvider>
      {!ready ? (
        <div className="min-h-screen bg-background" />
      ) : !accountant ? (
        <Onboarding onDone={setAccountant} />
      ) : (
        <Dashboard accountant={accountant} />
      )}
    </PreferencesProvider>
  );
}
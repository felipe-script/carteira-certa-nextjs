import { Badge } from "@/components/ui/badge";
import { InfoContribution } from "@/features/portfolio/components/info-contribution";
import { Dashboard } from "@/features/portfolio/Dashboard";
import { Check } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold leading-none">
              Carteira Certa <Check className="text-green-400" size={14} />
            </h1>
            <div className="text-sm text-muted-foreground">
              Preencha os campos e veja quanto aportar.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary">Free</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Dashboard />
          <InfoContribution />
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-muted-foreground">
          Não é recomendação de investimento.
        </div>
      </footer>
    </div>
  );
}

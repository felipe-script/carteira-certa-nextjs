"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateClassContribution } from "@/domain/contribution/classContribution";
import type { AllocationClass } from "@/domain/contribution/types";

import { formatBRL, formatPct } from "./format";
import { getInitialState, loadState, saveState, type StoredState } from "./storage";
import { Check } from "lucide-react";
import { InfoContribution } from "./components/info-contribution";
import { FREE_MAX_CLASSES } from "@/consts/consts";
import { PercentInput } from "./components/percent-input";


function newClassRow(): AllocationClass {
  return {
    id: crypto.randomUUID(),
    name: "",
    idealPct: 0,
    currentPct: 0,
    ignore: false,
  };
}

function parseNumberBR(input: string): number {
  // aceita "1.234,56", "1234,56", "1234.56" e também "25,00%"
  const raw = input.trim().replace(/R\$\s?/gi, "").replace(/%/g, "");

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  // Se vier no formato pt-BR com milhar e decimal (1.234,56)
  if (hasComma && hasDot) {
    const normalized = raw.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  // Se vier só com vírgula (1234,56)
  if (hasComma) {
    const normalized = raw.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  // Se vier só com ponto (1234.56) ou inteiro
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function formatNumberInputBR(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(n);
}



export function Dashboard() {
  const [state, setState] = React.useState<StoredState>(() => getInitialState());
  const [hydrated, setHydrated] = React.useState(false);
  const [contribution, setContribution] = React.useState<string>("1500");
  const [totalHaveInput, setTotalHaveInput] = React.useState<string>(() =>
    formatNumberInputBR(getInitialState().totalHave ?? 0)
  );

  React.useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setTotalHaveInput(formatNumberInputBR(loaded.totalHave ?? 0));
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [hydrated, state]);

  const canAddClass = state.classes.length < FREE_MAX_CLASSES;

  const addClass = () => {
    if (!canAddClass) return;
    setState((s) => ({ ...s, classes: [...s.classes, newClassRow()] }));
  };

  const removeClass = (classId: string) => {
    setState((s) => ({
      ...s,
      classes: s.classes.filter((c) => c.id !== classId),
    }));
  };

  const updateClass = (classId: string, patch: Partial<AllocationClass>) => {
    setState((s) => ({
      ...s,
      classes: s.classes.map((c) => (c.id === classId ? { ...c, ...patch } : c)),
    }));
  };

  const totalHave = Number.isFinite(state.totalHave) ? state.totalHave : 0;
  const contributionValue = parseNumberBR(contribution);
  const idealSum = state.classes
    .filter((c) => !c.ignore)
    .reduce((sum, c) => sum + (Number.isFinite(c.idealPct) ? c.idealPct : 0), 0);
  const currentSum = state.classes
    .filter((c) => !c.ignore)
    .reduce((sum, c) => sum + (Number.isFinite(c.currentPct) ? c.currentPct : 0), 0);

  const calc = calculateClassContribution({
    totalHave,
    contribution: contributionValue,
    classes: state.classes,
  });

  const amountById = new Map(calc.recommendations.map((r) => [r.classId, r.amount] as const));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold leading-none flex items-center gap-2">Carteira Certa <Check className="text-green-400" size={14}/></h1>
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
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Rebalanceador por Classe</CardTitle>
              <CardDescription>
                Tudo aqui é editável (classe, % ideal, % atual, valores). Use “Ignorar” se não quer aportar naquela classe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <Label className="text-muted-foreground" htmlFor="totalHave">
                    Quanto tenho (R$)
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="totalHave"
                      inputMode="decimal"
                      placeholder="Ex.: 9019,12"
                      value={totalHaveInput}
                      onChange={(e) => {
                        const nextText = e.target.value;
                        setTotalHaveInput(nextText);
                        setState((s) => ({
                          ...s,
                          totalHave: parseNumberBR(nextText),
                        }));
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Total da carteira hoje.
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <Label className="text-muted-foreground" htmlFor="contribution">
                    Novo aporte (R$)
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="contribution"
                      inputMode="decimal"
                      placeholder="Ex.: 1500,00"
                      value={contribution}
                      onChange={(e) => setContribution(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Quanto você vai investir agora.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-amber-50">
                  Total após aporte: <span className="text-success">{formatBRL(calc.totalAfter)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={Math.abs(idealSum - 100) < 0.001 ? "text-success" : "text-warning"}
                  >
                    % ideal: {formatPct(idealSum)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={Math.abs(currentSum - 100) < 0.001 ? "text-success" : "text-warning"}
                  >
                    % atual: {formatPct(currentSum)}
                  </Badge>
                </div>
              </div>

              {/* Mobile: cards (sem scroll horizontal) */}
              <div className="space-y-3 md:hidden">
                {state.classes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Adicione uma classe para começar.
                  </div>
                ) : (
                  state.classes.map((c) => {
                    const amount = amountById.get(c.id) ?? 0;
                    return (
                      <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <Label className="text-muted-foreground" htmlFor={`name-${c.id}`}>
                              Classe
                            </Label>
                            <div className="mt-2">
                              <Input
                                id={`name-${c.id}`}
                                value={c.name}
                                placeholder="Ex.: Ações do Brasil"
                                onChange={(e) => updateClass(c.id, { name: e.target.value })}
                              />
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="h-11"
                            onClick={() => removeClass(c.id)}
                          >
                            Remover
                          </Button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-muted-foreground" htmlFor={`ideal-${c.id}`}>
                              % Ideal
                            </Label>
                            <div className="mt-2">
                              <PercentInput
                                value={c.idealPct}
                                onChange={(next) => updateClass(c.id, { idealPct: next })}
                                ariaLabel={`Percentual ideal ${c.name || "classe"}`}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground" htmlFor={`current-${c.id}`}>
                              % Atual
                            </Label>
                            <div className="mt-2">
                              <PercentInput
                                value={c.currentPct}
                                onChange={(next) => updateClass(c.id, { currentPct: next })}
                                ariaLabel={`Percentual atual ${c.name || "classe"}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={Boolean(c.ignore)}
                              onCheckedChange={(checked) =>
                                updateClass(c.id, { ignore: checked === true })
                              }
                              aria-label={`Ignorar ${c.name || "classe"}`}
                            />
                            <span className="text-sm text-muted-foreground">Ignorar</span>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Quanto aportar</div>
                            <div className="text-base font-semibold">
                              {c.ignore ? "—" : formatBRL(amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop: tabela sem necessidade de scroll horizontal */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-80">Classe</TableHead>
                      <TableHead className="w-30">% Ideal</TableHead>
                      <TableHead className="w-35">% Atual</TableHead>
                      <TableHead className="w-22.5 text-center">Ignorar</TableHead>
                      <TableHead className="w-42.5 text-right">Quanto aportar</TableHead>
                      <TableHead className="w-30 text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.classes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          Adicione uma classe para começar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      state.classes.map((c) => {
                        const amount = amountById.get(c.id) ?? 0;
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <Input
                                value={c.name}
                                placeholder="Ex.: Ações do Brasil"
                                onChange={(e) => updateClass(c.id, { name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <PercentInput
                                value={c.idealPct}
                                onChange={(next) => updateClass(c.id, { idealPct: next })}
                                ariaLabel={`Percentual ideal ${c.name || "classe"}`}
                              />
                            </TableCell>
                            <TableCell>
                              <PercentInput
                                value={c.currentPct}
                                onChange={(next) => updateClass(c.id, { currentPct: next })}
                                ariaLabel={`Percentual atual ${c.name || "classe"}`}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={Boolean(c.ignore)}
                                onCheckedChange={(checked) =>
                                  updateClass(c.id, { ignore: checked === true })
                                }
                                aria-label={`Ignorar ${c.name || "classe"}`}
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {c.ignore ? "—" : formatBRL(amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                className="h-9 px-3 hover:text-red-500"
                                onClick={() => removeClass(c.id)}
                              >
                                Remover
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Usado do aporte:</span>{" "}
                  <span className="font-semibold tabular-nums">{formatBRL(calc.usedTotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Free: até {FREE_MAX_CLASSES} classes</Badge>
                  <Button onClick={addClass} disabled={!canAddClass}>
                    + Adicionar classe
                  </Button>
                </div>
              </div>

              {calc.notes.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    {calc.notes.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          <InfoContribution/>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-muted-foreground">
          MVP educacional. Não é recomendação de investimento.
        </div>
      </footer>
    </div>
  );
}

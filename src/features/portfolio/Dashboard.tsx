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
import { loadState, saveState, type StoredState } from "./storage";

const FREE_MAX_CLASSES = 10;

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
  // aceita "1.234,56" e "1234.56" e também "25,00%"
  const cleaned = input
    .trim()
    .replace(/R\$\s?/gi, "")
    .replace(/%/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function Dashboard() {
  const [state, setState] = React.useState<StoredState>(() => loadState());
  const [contribution, setContribution] = React.useState<string>("1500");

  React.useEffect(() => {
    saveState(state);
  }, [state]);

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
          <div>
            <div className="text-lg font-semibold">Carteira Certa</div>
            <div className="text-sm text-muted-foreground">
              Modelo Free: aporte por classe (estilo planilha)
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
                Informe % ideal e % atual. O sistema sugere quanto aportar por classe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground">Quanto tenho (R$)</label>
                  <Input
                    inputMode="decimal"
                    value={String(state.totalHave ?? 0)}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        totalHave: parseNumberBR(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Novo aporte (R$)</label>
                  <Input
                    inputMode="decimal"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Total após aporte: <span className="text-foreground">{formatBRL(calc.totalAfter)}</span>
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

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Classe</TableHead>
                      <TableHead>% Ideal</TableHead>
                      <TableHead>% Atual</TableHead>
                      <TableHead className="text-center">Ignorar</TableHead>
                      <TableHead className="text-right">Quanto aportar</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.classes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                          Adicione uma classe para começar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      state.classes.map((c) => {
                        const amount = amountById.get(c.id) ?? 0;
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="min-w-55">
                              <Input
                                value={c.name}
                                placeholder="Ações do Brasil"
                                onChange={(e) => updateClass(c.id, { name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell className="min-w-35">
                              <Input
                                type="number"
                                value={String(c.idealPct)}
                                min={0}
                                step={0.01}
                                onChange={(e) =>
                                  updateClass(c.id, {
                                    idealPct: Number(e.target.value || 0),
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell className="min-w-35">
                              <Input
                                type="number"
                                value={String(c.currentPct)}
                                min={0}
                                step={0.01}
                                onChange={(e) =>
                                  updateClass(c.id, {
                                    currentPct: Number(e.target.value || 0),
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={Boolean(c.ignore)}
                                onCheckedChange={(checked) =>
                                  updateClass(c.id, {
                                    ignore: checked === true,
                                  })
                                }
                                aria-label={`Ignorar ${c.name || "classe"}`}
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {c.ignore ? "—" : formatBRL(amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                className="h-9 px-3"
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
                <div className="text-sm text-muted-foreground">
                  Usado do aporte: <span className="text-foreground">{formatBRL(calc.usedTotal)}</span>
                  <span className="ml-3 text-warning">
                    Sobra: {formatBRL(calc.leftover)}
                  </span>
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

          <Card>
            <CardHeader>
              <CardTitle>Como funciona</CardTitle>
              <CardDescription>
                Igual à planilha: calcula o déficit em R$ de cada classe após o aporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                1) Converte % atual em valor: <span className="text-foreground">total atual × % atual</span>.
              </div>
              <div>
                2) Calcula valor ideal pós-aporte: <span className="text-foreground">(total + aporte) × % ideal</span>.
              </div>
              <div>
                3) Sugere aporte por classe: <span className="text-foreground">max(0, ideal − atual)</span>.
              </div>
              <div className="pt-2 text-xs">
                Observação: se os % ideais não somarem 100%, o sistema normaliza.
              </div>
            </CardContent>
          </Card>
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

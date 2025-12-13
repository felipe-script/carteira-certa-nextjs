import type { AllocationClass } from "@/domain/contribution/types";

const STORAGE_KEY_V2 = "carteira-certa:mvp:v2";
const STORAGE_KEY_V1 = "carteira-certa:mvp:v1";

export type StoredState = {
  totalHave: number;
  classes: AllocationClass[];
};

function defaultState(): StoredState {
  return {
    totalHave: 0,
    classes: [
      {
        id: crypto.randomUUID(),
        name: "Renda Fixa",
        idealPct: 25,
        currentPct: 0,
      },
      {
        id: crypto.randomUUID(),
        name: "Ações do Brasil",
        idealPct: 25,
        currentPct: 0,
      },
      {
        id: crypto.randomUUID(),
        name: "FIIs",
        idealPct: 25,
        currentPct: 0,
      },
      {
        id: crypto.randomUUID(),
        name: "Ações dos EUA",
        idealPct: 20,
        currentPct: 0,
      },
      {
        id: crypto.randomUUID(),
        name: "Bitcoin",
        idealPct: 5,
        currentPct: 0,
      },
    ],
  };
}

function migrateFromV1(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return null;
    // V1 era baseado em portfolios/ativos; como o novo MVP usa classes, não há mapeamento confiável.
    // Mantemos apenas o "totalHave" como 0 e iniciamos com o template padrão.
    return defaultState();
  } catch {
    return null;
  }
}

export function loadState(): StoredState {
  if (typeof window === "undefined") return defaultState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) {
      const migrated = migrateFromV1();
      return migrated ?? defaultState();
    }

    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const totalHave = typeof parsed.totalHave === "number" && Number.isFinite(parsed.totalHave) ? parsed.totalHave : 0;
    const classes = Array.isArray(parsed.classes) ? parsed.classes : [];

    if (classes.length === 0) return { ...defaultState(), totalHave };

    return {
      totalHave,
      classes: classes.map((c) => ({
        id: typeof c.id === "string" ? c.id : crypto.randomUUID(),
        name: typeof c.name === "string" ? c.name : "",
        idealPct: typeof c.idealPct === "number" ? c.idealPct : 0,
        currentPct: typeof c.currentPct === "number" ? c.currentPct : 0,
        ignore: typeof (c as { ignore?: unknown }).ignore === "boolean" ? (c as { ignore?: boolean }).ignore : false,
      })),
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: StoredState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
}

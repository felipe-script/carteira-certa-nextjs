import type { Asset } from "@/domain/portfolio/types";

function splitCsvLine(line: string, delimiter: string): string[] {
  // MVP: simples (sem aspas). Bom o suficiente para um CSV exportado de planilha.
  return line.split(delimiter).map((s) => s.trim());
}

function parseNumberBR(value: string): number {
  // aceita "10,5" ou "10.5"
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export type CsvImportResult = {
  assets: Omit<Asset, "id">[];
  warnings: string[];
};

/**
 * Espera colunas (header): symbol, quantity, price, targetPct
 * Também aceita: ticker
 */
export function parseAssetsCsv(text: string): CsvImportResult {
  const warnings: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { assets: [], warnings: ["CSV vazio ou sem dados."] };
  }

  const delimiter = lines[0]!.includes(";") ? ";" : ",";
  const header = splitCsvLine(lines[0]!, delimiter).map((h) => h.toLowerCase());

  const idx = {
    symbol: header.indexOf("symbol"),
    ticker: header.indexOf("ticker"),
    quantity: header.indexOf("quantity"),
    price: header.indexOf("price"),
    targetPct: header.indexOf("targetpct"),
  };

  const assets: Omit<Asset, "id">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]!, delimiter);

    const sym =
      (idx.symbol >= 0 ? parts[idx.symbol] : undefined) ||
      (idx.ticker >= 0 ? parts[idx.ticker] : undefined) ||
      "";

    const symbol = sym.trim().toUpperCase();
    if (!symbol) {
      warnings.push(`Linha ${i + 1}: símbolo vazio, ignorado.`);
      continue;
    }

    const quantity = idx.quantity >= 0 ? parseNumberBR(parts[idx.quantity] ?? "0") : 0;
    const price = idx.price >= 0 ? parseNumberBR(parts[idx.price] ?? "0") : 0;
    const targetPct = idx.targetPct >= 0 ? parseNumberBR(parts[idx.targetPct] ?? "0") : 0;

    assets.push({ symbol, quantity, price, targetPct });
  }

  return { assets, warnings };
}

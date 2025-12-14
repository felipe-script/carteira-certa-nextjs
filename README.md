# Carteira Certa (MVP)

MVP educacional para “buy and hold”: você informa quanto já tem investido, um novo aporte e uma lista de classes com % ideal / % atual.
O sistema sugere “quanto aportar” por classe para aproximar do ideal **sem vender**.

Projeto em Next.js (App Router) com UI em shadcn/ui + Tailwind (dark-only).

## Rodando local

```bash
pnpm install
pnpm dev
```

## Onde ficam os cálculos

Os cálculos estão isolados em `src/domain`.

- `src/domain/contribution/*`: modelo atual do MVP (rebalanceamento por CLASSE)
- `src/domain/portfolio/*`: modelo antigo/legado (rebalanceamento por ATIVO)

O front chama o domínio principalmente a partir de `src/features/portfolio/Dashboard.tsx`.

## Modelo atual (por classe) — passo a passo por função

Arquivo: `src/domain/contribution/classContribution.ts`

### `calculateClassContribution(...)`

Entrada:
- `totalHave`: total atual da carteira (R$)
- `contribution`: novo aporte (R$)
- `classes[]`: lista de classes com `name`, `% ideal`, `% atual` e `ignore`

Saída (`ClassContributionResult`):
- `totalHave`, `contribution`, `totalAfter`
- `usedTotal`: soma do que foi recomendado aportar (R$)
- `recommendations[]`: `[{ classId, name, amount }]`
- `notes[]`: avisos (ex.: normalização de %)

Passo a passo (visão de alto nível):
1) Sanitiza números (evita NaN/negativos) e calcula `totalAfter = totalHave + contribution`.
2) Remove classes sem nome e separa classes “ativas” (não ignoradas).
3) Normaliza os `% ideal` das ativas para somarem 100% (se necessário).
4) Converte R$ em centavos e transforma % em valores (R$) por classe usando uma alocação que fecha no centavo.
	- Isso evita erro de arredondar “linha a linha”.
5) Calcula déficit por classe: `deficit = max(0, desiredAfter - currentBefore)`.
6) Decide o plano de aporte:
	- Se não há déficit: não recomenda compras (comprar distorce o ideal sem vender).
	- Se o aporte não cobre o déficit total: distribui proporcional ao déficit.
	- Se cobre: recomenda até o déficit (não ultrapassa o ideal sem venda).
7) Ordena recomendações por maior valor e calcula `usedTotal`.

### `normalizeIdeals(classes)`

Objetivo: garantir que os `% ideal` das classes ativas somem 100%.

- Se a soma for `<= 0`: retorna mapa vazio (não dá para distribuir ideal).
- Caso contrário: `idealNormalizado = (ideal / somaIdeais) * 100`.

### `allocateCentsByWeights(totalCents, items)`

Objetivo: distribuir um total inteiro (centavos) por pesos, com soma exata.

Algoritmo (“largest remainder”):
1) `raw = totalCents * weight / soma(weight)`
2) usa `floor(raw)` como alocação inicial
3) distribui os centavos restantes para os itens com maior fração `raw - floor`

Propriedade: a soma final sempre fecha exatamente em `totalCents`.

### `toCents`, `fromCents`, `roundMoney`, `safeNumber`

Helpers de robustez numérica:
- `safeNumber`: NaN/Infinity -> 0
- `roundMoney`: 2 casas decimais
- `toCents` / `fromCents`: conversão para trabalhar com inteiros e fechar soma

## Modelo legado (por ativo) — passo a passo por função

Arquivo: `src/domain/portfolio/smartContribution.ts`

### `calculateSmartContribution(...)`

Este modelo trabalha por ativo (ticker), com preço e quantidade.

Passo a passo:
1) Sanitiza inputs e símbolos.
2) Calcula total atual (`portfolioTotal`).
3) Calcula total pós-aporte.
4) Normaliza targets e calcula o valor ideal por ativo após aporte.
5) Calcula déficit: `max(0, ideal - atual)`.
6) Distribui aporte por déficit/target.
7) Converte R$ planejado em unidades inteiras (floor), o que pode gerar sobra (`leftover`) por arredondamento.

Arquivo: `src/domain/portfolio/math.ts`

- `assetValue(asset)`: quantidade × preço (R$)
- `portfolioTotal(assets)`: soma de `assetValue`
- `normalizeTargets(assets)`: normaliza targets para 100%
- `percentOf(part, total)`: calcula porcentagem

## Observações importantes

- O modelo “por classe” é o foco do MVP.
- O domínio usa `number` para valores em R$, então para somas exatas o modelo por classe usa centavos (inteiros).
- A UI/persistência (localStorage) ficam em `src/features/portfolio/*`.

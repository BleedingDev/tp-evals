# Lab 07: Travel Info Summary

## Kontext

Testujete summary výstupy proti dodanému source textu. Model má shrnout užitečné informace, ale nesmí přidat schedule, cost, pravidla nebo varování, která ve zdroji nejsou. V cestovním kontextu je problém hlavně confident unsupported claim.

## Cíl

Ověřit required facts, forbidden claims, source uncertainty, warning handling a sentence limit tak, aby summary scorer i judge dávaly čitelné QA rozhodnutí.

## Soubory

- `evals/07-travel-info-summary.eval.ts`
- `data/evals/travel-info-summary.jsonl`
- `src/apps/travel-summary.ts`
- `src/scorers/summary.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:07
```

Vyberte jeden případ s úplným source textem a jeden případ, kde source nestačí na uživatelovu otázku. U každého porovnejte:

Tabulku čtěte takto:

- `focus` říká hlavní riziko: facts, warning, nebo limits.
- `source` je source-grounded summary score.
- `judge` je kvalita shrnutí podle summary kritérií.
- `next` říká první QA problém: source, quality, policy, nebo pass.

1. `requiredFacts` proti skutečnému source textu.
2. `forbiddenClaims` proti věcem, které by model mohl lákavě domyslet.
3. `includeWarning` a `insufficientSource`.
4. `maxSentences` a jestli podporuje uživatelsky použitelný output.
5. `minFactCoverage` a jeho vztah k riziku.

Navrhněte jednu malou expectation změnu: například přidejte forbidden claim, který by v produkci byl nebezpečný, nebo upravte `maxSentences`, pokud nutí model vynechat podstatné upozornění. Po re-run sledujte, jestli scorer vysvětluje změnu konkrétně.

## Gate / ověření

- `pnpm run lab:07` doběhne.
- Summary neobsahuje unsupported claims.
- Pokud je source insufficient, výstup to jasně říká místo domýšlení detailů.
- Warning není změněný z podmíněného na jistý stav.

## QA rozhodnutí

Rozhodněte, jestli je summary výstup vhodný pro release gate, review signal, nebo blocker.

Za blocker považujte hlavně vymyšlený policy detail, chybějící safety warning nebo zamlčení toho, že source text neobsahuje odpověď.

# Lab 02: Translation Guardrails

## Kontext

Testujete překladový tok, ve kterém musí model překládat běžný text, ale nesmí poškodit chráněné fragmenty: placeholders, inline tagy, syntetické kódy a glossary termíny. Výstup může znít plynule a přesto být release risk, pokud rozbije `{{count}}`, přepíše `KIT-42` nebo ztratí `<strong>`.

## Cíl

Ověřit, že rule-based scorer chrání strukturální fragmenty nezávisle na obecném dojmu z překladu, a zpřesnit jednu dataset expectation tak, aby QA signál nebyl jen kosmetický.

## Soubory

- `evals/02-translation-guardrails.eval.ts`
- `data/evals/translations-edge-cases.jsonl`
- `src/apps/translation.ts`
- `src/scorers/text-quality.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:02
```

V datasetu vyberte jeden případ s placeholders a jeden případ s tagy nebo protected code. Pro každý případ si zapište:

1. Které hodnoty musí zůstat byte-for-byte stejné.
2. Které hodnoty jsou glossary rozhodnutí, ne technická ochrana.
3. Které `forbiddenPatterns` by měly failnout i při jinak dobrém překladu.
4. Jaký business dopad má chyba: UI rozbití, špatný význam, nebo terminologická nekonzistence.

Potom udělejte jeden malý kontrolovaný návrh změny v expectation: například přidejte chybějící forbidden pattern, zpřísněte `minQualityScore`, nebo doplňte `expected.notes`, aby bylo jasné, proč je fragment chráněný.

V Evalite porovnejte scorery `text_guardrails`, `forbidden_phrases` a `protected_fragment_breakdown`. Zajímejte se o to, jestli selhání ukazuje konkrétní porušený fragment, ne jen nízký průměr.

## Gate / ověření

- `pnpm run lab:02` doběhne.
- Umíte říct, který scorer by zachytil rozbitý placeholder, který rozbitý tag a který glossary regresi.
- Vámi navržená expectation změna je úzká a nemění smysl testovaného případu.
- Výsledek se dá vysvětlit dalšímu testerovi bez znalosti implementace překladače.

## QA rozhodnutí

Rozhodněte, jestli by konkrétní selhání bylo:

- release blocker,
- regresní bug k opravě v promptu nebo model variantě,
- nebo přijatelný review signal pro ruční posouzení.

Rozhodnutí musí vycházet z chráněného fragmentu, ne z obecného dojmu, že překlad „zní dobře“.

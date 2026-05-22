# Lab 06: Live Prompt Variants

## Kontext

Porovnáváte dvě live prompt varianty přes AI proxy na stejné sadě překladových edge cases. Slabší varianta může mít lepší průměr na jednoduchých případech, ale selhat na konkrétním protected fragmentu. Silnější QA závěr proto musí být case-level, ne jen average score.

## Cíl

Vyhodnotit, jestli rozdíl mezi `plain-ui-translation` a `guardrailed-translation` pochází z promptu, model behavior, nebo z výběru dataset cases.

## Soubory

- `evals/06-prompt-model-variants.eval.ts`
- `data/evals/translations-edge-cases.jsonl`
- `src/variants/index.ts`
- `src/apps/translation.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:06
```

V `evals/06-prompt-model-variants.eval.ts` najděte:

1. `variants`, kde jsou definované dvě porovnávané varianty.
2. `records.filter(...)`, kde je omezený výběr dataset cases.

V Evalite porovnejte varianty po jednotlivých řádcích:

Tabulku čtěte takto:

- `case` je stejný dataset case napříč variantami.
- Evalite sloupec `Variant` je `plain` nebo `guard`.
- `risk` ukazuje riziko konkrétního case.
- `guard` je skóre hard guardrails.
- `judge` je kvalita významu podle translation kritérií.
- `next` říká první QA krok: block, quality, compare, nebo pass.

1. Zůstaly placeholders přesně stejné?
2. Zůstaly tagy vyvážené?
3. Zůstaly protected codes přesné?
4. Zlepšila se glossary konzistence, nebo jen judge score?
5. Skrývá průměr jeden protected-fragment fail nebo medium-risk review?

Proveďte jeden kontrolovaný experiment: přidejte do výběru case ID `translation-edge-mode-de`, znovu spusťte lab a porovnejte, jestli se QA závěr o lepší variantě změnil. Pokud chcete silnější kontrast, změňte první variantu z `translation.baseline` na `translation.flawed` a sledujte, jestli scorer rozdíl zachytí na správných cases.

## Gate / ověření

- `pnpm run lab:06` doběhne.
- Víte, které cases jsou v porovnání zahrnuté a proč.
- Rozdíl mezi variantami umíte popsat case-level, ne jen průměrem.
- Live model behavior neinterpretujete jako deterministický výsledek bez kontroly konkrétních outputů.

## QA rozhodnutí

Rozhodněte, která prompt varianta je bezpečnější pro další testovací kolo a jaké riziko ještě zůstává.

Pokud jedna varianta zlepší average score, ale rozbije protected fragment, označte ji jako review risk nebo release blocker podle dopadu fragmentu.

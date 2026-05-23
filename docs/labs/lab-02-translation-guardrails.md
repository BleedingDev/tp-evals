# Lab 02: Translation Guardrails

## Kontext

Testujete překladový tok, ve kterém musí model překládat běžný text, ale nesmí poškodit chráněné fragmenty: placeholders, inline tagy, syntetické kódy a glossary termíny. Výstup může znít plynule a přesto být release risk, pokud rozbije `{{count}}`, přepíše `KIT-42` nebo ztratí `<strong>`.

## Cíl

Ověřit, že rule-based scorer chrání strukturální fragmenty nezávisle na obecném dojmu z překladu, a zpřesnit jednu dataset expectation tak, aby QA signál nebyl jen kosmetický.

## Runtime a kontrakt

- Runtime: live generation + deterministic scorers.
- Stabilní lab contract: [Lab 02](../facilitator/lab-contracts.md#lab-02---translation-guardrails).
- Pořadí cases má být stabilní, ale score se v live režimu může změnit podle výstupu modelu.

## Soubory

- `.evalite/results/lab-02.json` = výsledek běhu: output, scores, detaily.
- `data/evals/translations-edge-cases.jsonl` = dataset: input a expected.
- `evals/02-translation-guardrails.eval.ts` = scoring logika.
- `src/apps/translation.ts` = testovaná překladová funkce.
- `src/scorers/text-quality.ts` = sdílené scorery pro textové guardrails.

## Úkol

Spusťte lab:

```sh
pnpm run lab:02
```

Tabulku čtěte takto:

- Pořadí řádků není součást úkolu. Vždy se orientujte podle `case`.
- `guard` je hard guardrail score: placeholders, tagy, kódy a glossary.
- `forbid` je kontrola zakázaných tvarů a rozbitých protected fragmentů.
- `frag` je samostatný breakdown chráněných fragmentů: placeholders, tagy a glossary.
- Finální `Score` je průměr viditelných scorerů `guard`, `forbid` a `frag`.
- `next` říká první QA problém: hard fail, forbidden, review, nebo pass.
- `next` má pro QA vyšší váhu než průměr. Case může mít slušný průměr a stejně být hard fail, pokud spadne chráněný fragment.

### A. Analýza připraveného failu, bez editace

1. Otevřete `.evalite/results/lab-02.json`.
2. Najděte `translation-edge-tags-fr`.
3. Čtěte `output.text` a `scores`.
4. Očekávání porovnejte s dataset row v `data/evals/translations-edge-cases.jsonl`: hlavně `expected.mustPreserve` a `expected.forbiddenPatterns`.
5. Určete, které tvrdé pravidlo spadlo: tag, protected code, forbidden phrase, nebo glossary.
6. Pokud finální `Score` působí překvapivě, zkontrolujte i `frag`; počítá se do průměru stejně jako `guard` a `forbid`.

`translation-edge-tags-fr` neupravujte. Je to hotový příklad failu, na kterém se učíte číst výsledek.

### B. Kontrolovaný experiment, editace jiného case

1. Otevřete `data/evals/translations-edge-cases.jsonl`.
2. Najděte `translation-edge-placeholders-es`.
3. Do `input.placeholders` přidejte třetí hodnotu `{{missing_placeholder}}`.
4. Spusťte znovu `pnpm run lab:02`.
5. V `.evalite/results/lab-02.json` zkontrolujte `translation-edge-placeholders-es` a jeho `scores`.
6. Sledujte, že scorer začne čekat placeholder, který output neobsahuje, a score spadne.

Pozor: pro tento placeholder case scorer čte očekávané placeholdery z `input.placeholders`, ne z `expected.mustPreserve`. Změna `expected.mustPreserve` placeholder guardrail nerozbije.

Pokud při live běhu klesne i jiný case než `translation-edge-placeholders-es`, není to efekt B experimentu. Je to samostatný live-model signál, typicky glossary nebo formulace. B experiment sledujte vždy jen na stejném case ID.

Pro každý případ si zapište:

1. Které hodnoty musí zůstat byte-for-byte stejné.
2. Které hodnoty jsou glossary rozhodnutí, ne technická ochrana.
3. Které `forbiddenPatterns` by měly failnout i při jinak dobrém překladu.
4. Jaký business dopad má chyba: UI rozbití, špatný význam, nebo terminologická nekonzistence.

Po experimentu odeberte `{{missing_placeholder}}`. Smyslem není dataset trvale rozbít, ale pochopit vztah mezi dataset expectation, scorerem a výsledným score.

V Evalite porovnejte scorery `text_guardrails`, `forbidden_phrases` a `protected_fragment_breakdown`. Zajímejte se o to, jestli selhání ukazuje konkrétní porušený fragment, ne jen nízký průměr.

## Kontrolní otázky

- Který konkrétní fragment se nesmí změnit byte-for-byte?
- Je chyba strukturální hard fail, nebo jen horší jazyková kvalita?
- Sledujete při experimentu pořád stejný case ID `translation-edge-placeholders-es`?

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

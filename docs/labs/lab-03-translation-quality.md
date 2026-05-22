# Lab 03: Translation Quality Judge

## Kontext

V Labu 02 jste řešili tvrdé guardrails. Tady porovnáváte tyto kontroly s `judge` hodnocením, které má zachytit význam, plynulost a vhodnost překladu. Silný QA tým musí umět rozlišit, kdy stačí rule-based scorer a kdy je potřeba LLM as a Judge.

## Cíl

Vybrat passing, borderline a failing překladový případ, porovnat rule-based signály s judge score a rozhodnout, jestli je nastavený threshold použitelný pro release gate.

## Soubory

- `evals/03-translation-quality.eval.ts`
- `data/evals/translations-basic.jsonl`
- `data/evals/translations-edge-cases.jsonl`
- `src/judges/rubrics.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:03
```

Vyberte tři případy:

1. Jeden passing případ, kde by měly projít guardrails i judge.
2. Jeden borderline případ, kde je otázka spíš QA policy než syntaxe.
3. Jeden failing případ, kde by nízké judge score mělo být očekávané.

Tabulku čtěte jako triage:

- `guardrails` říká, jestli zůstaly zachované placeholders, tagy, kódy, forbidden phrases a glossary.
- `judge` říká, jestli překlad dává významově a produktově smysl podle kritérií.
- `next` říká, kam se má QA dívat dál: `hard fail`, `quality`, `policy`, nebo `pass`.

U každého vybraného případu porovnejte `idealText`, `mustPreserve`, `forbiddenPatterns`, `glossary` a `minQualityScore` s Evalite výstupem. Pak si přečtěte kritéria pro `translation` a určete, která dimenze rozhoduje o kvalitě víc než exact match.

Doporučené anchors:

- `translation-basic-cancel-es`: guardrails mohou projít, ale judge chytí otočený význam.
- `translation-edge-tags-fr`: strukturální hard fail; chybí tagy a chráněný kód.
- `translation-edge-drawer-es`: policy review nad glossary termínem.

Navrhněte jednu malou změnu: buď upravte threshold tak, aby odpovídal riziku, nebo doplňte expectation note, která vysvětluje borderline rozhodnutí. Cílem není donutit všechny případy projít. Cílem je mít eval, který generuje užitečné QA rozhodnutí.

## Gate / ověření

- `pnpm run lab:03` doběhne.
- U každého ze tří případů víte, jestli selhání pochází z guardrail, judge, nebo špatně nastavené expectation.
- Threshold umíte obhájit podle rizika, ne podle toho, jestli chcete zelený výstup.
- Borderline případ zůstane reviewovatelný a nezmizí v průměru.

## QA rozhodnutí

Rozhodněte, jestli by translation suite měla být automatický release gate, review dashboard, nebo kalibrační sada pro další prompt/model varianty.

Do rozhodnutí zahrňte, které chyby jsou objektivní strukturální fail a které potřebují judge nebo lidský review.

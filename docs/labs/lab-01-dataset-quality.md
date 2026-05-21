# Lab 01: Dataset Quality Audit

## Kontext

Pracujete jako QA automation engineer, který má zastavit nekvalitní eval dataset dřív, než začne zkreslovat Evalite výsledky. Dataset je schválně rozbitý: některé řádky mají prázdné štítky, špatné anonymizační flagy, neplatný `risk`, překlep v `capability`, prázdné `participantEditTargets` nebo threshold mimo povolený rozsah.

Nejde o opravu aplikace ani o hromadnou úpravu fixture dat. Cílem je ověřit, že auditní checker najde záměrně rozbité fields, a podle jeho výstupu navrhnout minimální bezpečné fixy.

Zelené score v tomto labu znamená: audit našel očekávané vady. Neznamená: dataset je čistý a připravený pro release gate.

## Cíl

Najít přesné chyby v každém JSONL řádku, porovnat je se scorer výstupem a navrhnout minimální opravu, která by dataset vrátila do sdílené workshopové kvality.

## Soubory

- `evals/01-dataset-quality.eval.ts`
- `data/evals/dataset-quality-broken.jsonl`
- `src/datasets/jsonl.ts`
- `src/datasets/schemas.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:01
```

Terminál ukazuje jen zkrácené preview. Pokud je řádek useknutý, berte ho jako navigaci a otevřete plný výsledek v `.evalite/results/lab-01.json`.

Otevřete `data/evals/dataset-quality-broken.jsonl` a pro každý řádek napište krátký audit note:

1. Jaký field je rozbitý.
2. Proč je to QA riziko pro eval nebo release rozhodnutí.
3. Jaká by byla nejmenší bezpečná změna.
4. Jestli se chyba dá chytit automaticky, nebo potřebuje lidský review.

V Evalite porovnejte scorer `detected_dataset_issues` se `suggested_fix_checklist`. Neřešte jen score. Hledejte, jestli metadata dávají testerovi dost informací k rozhodnutí: `expectedBehavior`, `risk`, `labels`, `metadata.reviewHint`, `metadata.participantEditTargets` a threshold hodnoty.

Ve výstupu nejdřív hledejte `rowStatus`. Hodnota `broken` říká, že checker našel rozbitý dataset row. Teprve potom řešte `detectedIssueTypes` a `suggestedFixes`.

Pokud chcete udělat kontrolovaný experiment, navrhněte jednu konkrétní opravu řádku `broken-empty-edit-targets`: jaký `participantEditTargets` by dával smysl a jaký validní `minIntentConfidence` byste nastavili. Opravu můžete diskutovat jako diff návrh; pointa labu je audit, ne masová editace datasetu.

## Gate / ověření

- `pnpm run lab:01` doběhne.
- U každého rozbitého řádku umíte vysvětlit rozdíl mezi `detectedIssueTypes` a `suggestedFixes`.
- Návrh opravy neobsahuje reálná zákaznická ani citlivá data.
- Každý navržený threshold je v rozsahu 0 až 1 a má QA důvod.

## QA rozhodnutí

Rozhodněte, jestli je dataset:

- blokující pro další eval běh,
- použitelný jen jako review signal,
- nebo dostatečně opravený pro automatický gate.

Svoje rozhodnutí opřete o konkrétní chybějící fields a o to, jestli by scorer selhal srozumitelně pro dalšího testera.

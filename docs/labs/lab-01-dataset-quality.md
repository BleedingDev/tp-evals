# Lab 01: Dataset Quality Repair

## Kontext

Pracujete jako QA automation engineer, který má zastavit nekvalitní eval dataset dřív, než začne zkreslovat Evalite výsledky. Dataset je schválně rozbitý: některé řádky mají prázdné štítky, špatné anonymizační flagy, neplatný `risk`, překlep v `capability`, prázdné `participantEditTargets` nebo threshold mimo povolený rozsah.

Nejde o opravu aplikace. Cílem je z datasetu vytěžit auditovatelný repair plan a rozhodnout, které kontroly patří do automatického gate a které mají zůstat v ruční QA review.

## Cíl

Najít přesné chyby v každém JSONL řádku, porovnat je se scorer výstupem a navrhnout minimální opravu, která by dataset vrátila do sdílené workshopové kvality.

## Soubory

- `evals/01-dataset-quality.eval.ts`
- `data/evals/dataset-quality-broken.jsonl`
- `src/datasets/index.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:01
```

Otevřete `data/evals/dataset-quality-broken.jsonl` a pro každý řádek napište krátký repair note:

1. Jaký field je rozbitý.
2. Proč je to QA riziko pro eval nebo release rozhodnutí.
3. Jaká by byla nejmenší bezpečná změna.
4. Jestli se chyba dá chytit automaticky, nebo potřebuje lidský review.

V Evalite porovnejte scorer `detected_repair_issues` s `repair_checklist`. Neřešte jen score. Hledejte, jestli metadata dávají testerovi dost informací k rozhodnutí: `expectedBehavior`, `risk`, `labels`, `metadata.reviewHint`, `metadata.participantEditTargets` a threshold hodnoty.

Pokud chcete udělat kontrolovaný experiment, navrhněte jednu konkrétní opravu řádku `broken-empty-edit-targets`: jaký `participantEditTargets` by dával smysl a jaký validní `minIntentConfidence` byste nastavili. Opravu můžete diskutovat jako diff návrh; pointa labu je audit, ne masová editace datasetu.

## Gate / ověření

- `pnpm run lab:01` doběhne.
- U každého rozbitého řádku umíte vysvětlit rozdíl mezi `detectedIssueTypes` a očekávaným checklistem.
- Repair plan neobsahuje reálná zákaznická ani citlivá data.
- Každý navržený threshold je v rozsahu 0 až 1 a má QA důvod.

## QA rozhodnutí

Rozhodněte, jestli je dataset:

- blokující pro další eval běh,
- použitelný jen jako review signal,
- nebo dostatečně opravený pro automatický gate.

Svoje rozhodnutí opřete o konkrétní chybějící fields a o to, jestli by scorer selhal srozumitelně pro dalšího testera.

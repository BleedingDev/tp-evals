# Lab 08: Judge Calibration

## Kontext

LLM as a Judge pomáhá hodnotit kvalitu, která nejde snadno zkontrolovat exact matchem: význam, unsupported claims, warning handling nebo srozumitelnost. Judge ale nesmí být černá skříňka. Nejdřív ho musíte kalibrovat na known good, borderline a known bad příkladech.

Pokud calibration failne, neznamená to automaticky, že aplikace je špatná. Nejdřív zkontrolujte rubric, příklady, score bands a samotný judge output.

## Cíl

Ověřit, že známé příklady padají do očekávaných score bands a že borderline případ zůstává reviewovatelný místo toho, aby byl falešně zelený nebo červený.

## Soubory

- `evals/08-judge-calibration.eval.ts`
- `src/judges/live-judge.ts`
- `src/judges/rubrics.ts`
- `src/scorers/judge.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:08
```

V `evals/08-judge-calibration.eval.ts` najděte `calibrationData`. Pro každý příklad porovnejte:

1. `output`, který judge hodnotí.
2. `expectedBehavior`, tedy proč je příklad good, borderline nebo bad.
3. `expected.targetBand`, `minScore` a `maxScore`.
4. Skutečný `judgeScore`.
5. `dimensionScores`, které score táhnou nahoru nebo dolů.

Pak navrhněte jednu kalibrační změnu. Typicky zpřesněte hranici borderline pásma, aby známý hraniční případ nebyl automaticky považovaný za release pass. Nehýbejte pásmem jen proto, aby aktuální výstup prošel; napište QA důvod.

## Gate / ověření

- `pnpm run lab:08` doběhne.
- Known good je v good band, known bad v bad band, borderline má prostor pro review.
- Umíte identifikovat dimenzi, která způsobila odchylku.
- Judge threshold je obhajitelný pro daný typ rizika.

## QA rozhodnutí

Rozhodněte, jestli je judge připravený jako gate pro další laby, nebo zatím jen jako review signal.

Pokud kalibrace nedrží na known bad prompt injection nebo unsupported summary příkladu, nepoužívejte judge jako jediný release gate.

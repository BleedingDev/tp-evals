# Lab Workflow

Všechny laby používejte stejnou smyčkou:

```text
Observe -> Explain -> Modify -> Re-run -> Decide
```

## Jak číst materiály

1. Spusťte příkaz labu, například `pnpm run lab:04`.
2. Neberte tabulku jako celý důkaz. Tabulka je triage: ukáže case, skóre a první místo, kam se dívat.
3. Otevřete result JSON uvedený v kontraktu, například `.evalite/results/lab-04.json`.
4. Stejné case ID najděte v datasetu pod `data/evals`.
5. Porovnejte `input`, `expected`, reálný `output` a detailní `scores`.
6. Udělejte jen úzkou změnu uvedenou v labu.
7. Spusťte lab znovu.
8. Rozhodněte continue / review / stop vlastními slovy.

## Co je stabilní a co může driftovat

- Local deterministic laby mají mít stejné pořadí i score při opakovaném spuštění.
- Live generation laby mají stabilní dataset a scorer, ale model output může driftovat.
- LLM as a Judge laby mají navíc možný drift v judge hodnocení.
- Pokud je úkol navázaný na konkrétní case ID, sledujte vždy tento case ID. Změna jiného case v live běhu je samostatný signál.

## Source Of Truth

- Úkol pro účastníka je v konkrétním handoutu: [Lab 01](lab-01-dataset-quality.md), [Lab 02](lab-02-translation-guardrails.md), [Lab 03](lab-03-translation-quality.md), [Lab 04](lab-04-mobile-search-intent.md), [Lab 05](lab-05-mobile-search-conversation.md), [Lab 06](lab-06-prompt-model-variants.md), [Lab 07](lab-07-travel-info-summary.md), [Lab 08](lab-08-judge-calibration.md), [Lab 09](lab-09-prompt-injection.md), [Lab 10](lab-10-consistency-regression.md), [Lab 11](lab-11-agentic-eval-authoring.md).
- Krátký runtime contract se vytiskne po spuštění `pnpm run lab:NN`.
- Lektorská mapa je v `docs/facilitator/lab-contracts.md` a `docs/facilitator/golden-path.md`.

## Pravidlo pro editace

Neopravujte celý workshopový dataset. Každý lab chce jednu malou řízenou změnu, která ukáže vztah mezi datasetem, scorerem a QA rozhodnutím. Po experimentu vraťte demonstrační změnu zpět, pokud se z ní nemá stát nový regression case.

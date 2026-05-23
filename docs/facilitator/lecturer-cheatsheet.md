# Lektorsky cheatsheet

## Obecny ramec

Prvni laby nejsou o velkem vymysleni. Jsou o tom, aby ucastnici umeli cist eval vystup, rozlisit typ signalu a pochopit vztah:

```text
dataset -> model output -> scorers -> score/details -> QA decision
```

Rikat:

> Nejdřív se učíme číst evaly. Pak z režimu auditor přejdeme do režimu autor.

## Dataset

Dataset neni odpoved modelu. Je to zadani eval case.

- `input`: co posilame aplikaci/modelu
- `expected`: co ocekavame
- `risk`: jak moc to boli
- `labels`: cim case filtrujeme
- `expectedBehavior`: proc case existuje

Produkcni log neni hotovy dataset. Je to surovina.

```text
production trace -> anonymizace -> minimal input -> expected behavior -> risk/labels -> JSONL case
```

## Evalite vystup

Horni score rika stav cele suite proti thresholdu.

Radek tabulky = jeden dataset case.

Tabulka je triage, ne kompletni duvod. Detail je v:

```text
.evalite/results/lab-XX.json
```

Kdyz je neco nejasne:

1. najit case v tabulce
2. otevrit result JSON
3. najit stejny case
4. cist `output` a `scores`
5. porovnat s datasetem

## Score

Score neni pravda. Je to signal pro rozhodnuti.

Ptame se:

- Je to hard fail?
- Je to quality review?
- Je to policy/product rozhodnuti?
- Je to jen variance live modelu?

## Lab 01

Cil: pochopit, ze zelene score neznamena cisty dataset.

Dataset je zamerne rozbity.

Rikat:

> 100 % znamena, ze audit nasel planovane vady. Ne ze dataset je pripraveny do release gate.

Cist hlavne:

- `rowStatus`
- `issues`
- `fixPlan`

## Lab 02

Cil: tvrde guardrails u prekladu.

Kontrolujeme:

- placeholders
- inline tags
- protected codes
- glossary
- forbidden patterns

Sloupce:

- `guard`: sdruzene hard guardrails
- `forbid`: zakazane tvary / explicitni forbidden patterns
- `frag`: breakdown protected fragments, pocita se do finalniho Score
- `next`: prvni QA krok

Rikat:

> Finalni Score je prumer scoreru `guard`, `forbid` a `frag`. Kdyz je `guard` vyssi, ale Score nizsi, hledejte rozdil ve `frag`.
> `next` je QA rozhodnuti, ne prumer. Chraneny fragment muze udelat hard fail i pri relativne vysokem Score.

`translation-edge-tags-fr` je pripraveny fail. Jen analyzovat.

`translation-edge-placeholders-es` je experimentalni case. Tam mohou pridat `{{missing_placeholder}}`.

Pozor:

`input.placeholders` ridi placeholder scorer. Ne `expected.mustPreserve`.

## Lab 03

Cil: rozdil mezi guardrails a judge.

Sloupce:

- `guard`: tvrda pravidla
- `judge`: vyznam/kvalita
- `next`: dalsi QA krok

Rikat:

> Guardrails rikaji, jestli se nerozbila struktura. Judge rika, jestli odpoved dava vyznamove a produktove smysl.

Priklady:

- `tags`: hard fail, chybi tagy/kod
- `cancel`: guard muze projit, ale judge chyti otoceny vyznam
- `drawer`: policy/terminology review

## Sloty

`slot` neni obecne required field.

Slot = konkretni business hodnota vytazena ze vstupu nebo historie.

Priklad:

```json
{
  "origin": "Boston",
  "destination": "Lisbon",
  "maxPrice": 550
}
```

- `requiredSlot`: v tomhle case musi byt spravne vyplneny
- `missingSlot`: chybi a model ho ma priznat / doptat se
- `disallowedSlot`: model ho nesmi vymyslet

## Intent sloupec

`intent` cist jako:

```text
expected->actual
```

Vlevo ocekavani z datasetu, vpravo vystup modelu.

Priklad:

```text
find->find
```

OK.

```text
ask->open
```

Problem. Dataset cekal doptani, model by otevrel vysledek.

Zkratky:

- `find` = `find_item`
- `ask` = `ask_clarification`
- `open` = `open_result`
- `cmp` = `compare_options`
- `flt` = `filter_results`

## Lab 04

Cil: single-turn mobile search intent extraction.

Kontrolujeme:

- intent
- slots
- confidence
- missing fields
- invented/disallowed slots

Sloupce:

- `intent`: expected->actual
- `conf`: confidence / threshold
- `slots`: required slots + missing status
- `schema`: scorer structured_output
- `noinv`: scorer disallowed_slots
- `next`: prvni QA problem

Rikat:

> Tady resime, jestli vystup muze bezpecne spustit dalsi akci v aplikaci.

## Lab 05

Didakticke rozsireni Labu 04.

Ramovani:

> Lab 04 byl single input. Lab 05 ukazuje, co by se muselo testovat, pokud search bude konverzacni.

Nepredpokladat, ze jejich app to uz presne takhle dela.

Klicova otazka:

> Je vstup vzdy kompletni pozadavek, nebo muze navazovat na predchozi vysledek?

Ukol:

1. vybrat jeden `pass` a jeden non-pass case
2. napsat trace: historie vs aktualni veta
3. oznacit carried slots, new slots, missing slots
4. rozhodnout action vs clarification
5. upravit ambiguous historii na jednoznacnou a pustit znovu

Sloupce:

- `schema`: structured output shape + intent/slots/missing/confidence
- `state`: conversation-state scorer
- `judge`: kvalita rozhodnuti v kontextu konverzace
- `next`: prvni QA krok

## Lab 05 Ambiguous Reference

Cil: ukazat riziko nejednoznacneho odkazu.

Priklad:

```text
Result 1: nonstop
Result 2: one stop
Result 3: nonstop

show me the nonstop one
```

`the nonstop one` sedi na Result 1 i Result 3.

Spravne:

```text
intent: ask_clarification
missing: unique_result
```

Spatne: otevrit prvni nonstop vysledek.

Rikat:

> Netestujeme tady STT ani samotne vyhledavani. Testujeme, jestli model smi prevest vetu na akci.

## Lab 06

Cil: porovnat prompt varianty nad stejnymi cases.

Neresit jen prumer.

Cist:

- stejny case napric `plain` a `guard`
- `guard`
- `judge`
- `next`

Rikat:

> Lepsi average nestaci, pokud konkretni protected-fragment case failuje. Nevybirame vitezny prompt jen podle prumeru.

## Lab 07

Cil: summary jen z dodaneho source textu.

Kontrolujeme:

- required facts
- unsupported claims
- warning/uncertainty
- insufficient source
- max sentences

Rikat:

> Model nesmi domyslet schedule, cost ani policy detail, ktery ve zdroji neni.

## Lab 08

Cil: kalibrace judge.

Tady netestujeme aplikaci. Testujeme judge.

Known good ma byt good. Known bad ma byt bad. Borderline ma zustat review.

Sloupce:

- `judge`: realne score, ktere judge dal hodnocenemu outputu
- `weakest`: nejslabsi dimenze judge hodnoceni
- `fit`: jestli `judge` spadlo do ocekavaneho pasma
- `Score`: stejne jako `fit`, tedy kvalita kalibrace, ne kvalita outputu

`next=band ok` znamena, ze kalibrace dopadla spravne, ne ze output je dobry.

## Lab 09

Cil: prompt injection.

Oddelit:

- trusted instruction
- user request
- supplied text

Rikat:

> Instrukce uvnitr supplied textu jsou data, ne prikaz.

Release blocker:

- model poslechne injected instrukci
- vymysli hidden note
- zmeni task
- leakne system-like obsah

## Lab 10

Cil: konzistence v nedeterminismu.

Necekame stejne vety. Cekame stejny business invariant.

Kontrolovat:

- invariant answer
- mustMatchFields
- allowedDifferences
- regression proti baseline

Rikat:

> Hledame drift chovani, ne stylistickou varianci.

## Lab 11

Cil: agent jako QA authoring pomocnik.

Nejdriv vlastni assignment, fallback prompt az pri zaseknuti.

Agent ma dodat:

- 1 synteticky case
- 1 malou review/scorer kontrolu
- uzky scope
- zadna realna data
- report zmen

Rikat:

> Agent zrychluje authoring. QA vlastni risk, expected behavior, threshold a rozhodnuti.

# Lab 11 Fallback Agent Prompt: missing source information case

Použijte jen jako fallback, pokud se zaseknete při práci s krátkým primárním assignmentem v labu. Primární cesta labu je konkrétní zadání: jeden syntetický travel-summary case pro missing source information, jedna malá metadata/review kontrola, gate příkazy a vlastní QA rozhodnutí.

```text
Pomáháš v Evalite QA workshop repozitáři.

Kontext:
- Cílem je Lab 11, ne úprava celé eval infrastruktury.
- QA vlastník chce jeden nový syntetický travel summary eval case a jednu malou eval-code kontrolu.
- Data musí být share-safe a nesmí používat reálné company, customer, passenger, booking, airport ani route údaje.

Cíl:
Přidej jeden nový syntetický travel-summary case pro Lab 11 a jednu malou kontrolu, která zlepší reviewovatelnost případu. Case má testovat missing source information: summary nesmí doplnit informaci, která ve sourceText chybí.

Povolené soubory:
- data/evals/agent-authored-summary.jsonl
- evals/11-agentic-eval-authoring.eval.ts

Úkol:
1. Přidej přesně jeden nový JSONL řádek do data/evals/agent-authored-summary.jsonl.
2. Dodrž existující TravelSummaryRecord shape.
3. Použij syntetický sourceText a syntetické smyšlené detaily.
4. Vyplň jasné expectedBehavior, labels, risk, metadata.reviewHint, metadata.participantEditTargets, requiredFacts, forbiddenClaims a notes.
5. Přidej jednu malou lokální kontrolu v evals/11-agentic-eval-authoring.eval.ts:
   - scorer,
   - metadata assertion,
   - nebo review check.
6. Kontrola musí pomáhat QA reviewerovi rozhodnout, ne jen ověřovat triviální existenci pole.
7. Neměň ostatní labs, package/config, slides, src mimo explicitně povolený soubor ani evals mimo Lab 11.
8. Preferuj jeden přesný high-value case před větším dataset dumpem.

Gate / ověření:
- Spusť pnpm run data:check.
- Spusť pnpm run lab:11.

Report:
- Vyjmenuj changed files.
- Popiš přidaný eval-code check.
- Popiš pokryté riziko.
- Řekni, jestli výsledek považuješ za release blocker, review signal, nebo weak case k přepsání.
```

Po agentově diffu proveďte vlastní QA review. Agent může draftovat case, ale konečné expected behavior, threshold a release rozhodnutí patří QA vlastníkovi.

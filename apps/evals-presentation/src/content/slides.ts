export type DeckSlide = {
  title: string;
  eyebrow?: string;
  hint?: string;
  task?: string;
  items?: string[];
  code?: string;
  language?: string;
  note?: string;
  center?: boolean;
};

export const slides: DeckSlide[] = [
  {
    title: "Testování AI aplikací",
    eyebrow: "Evals pro QA rozhodování",
    items: [
      "Zachytit AI regresi dřív než poškodí uživatele nebo proces",
      "Rozhodnout continue / review / stop podle důkazů",
      "Porovnat prompt, model a data na stejné sadě případů",
      "Dát QA týmu opakovatelný release gate",
    ],
    note: "Cíl: praktický eval proces pro pokročilé QA, kteří potřebují řídit riziko AI výstupů",
    center: true,
  },
  {
    title: "Proč to QA řeší",
    eyebrow: "Byznysová hodnota",
    items: [
      "AI chyba často vypadá jako přesvědčivě špatná odpověď",
      "Ruční smoke test několika promptů nehlídá trend",
      "Prompt, model i data jsou release surface",
      "Eval evidence zkracuje spor mezi product, dev a QA",
    ],
    code: `decision artifact:
dataset + score + failing cases + threshold + run metadata`,
    language: "md",
  },
  {
    title: "Evals nejsou unit testy",
    eyebrow: "Základní mentální model",
    items: [
      "Nehledáme jednu ideální větu",
      "Měříme chování na sadě rizikových případů",
      "Score je signál pro rozhodnutí, ne dekorace dashboardu",
      "Tester musí rychle poznat, proč je case failing nebo borderline",
    ],
    code: `release decision = risk + trend + concrete failures`,
    language: "md",
  },
  {
    title: "Data jsou základ",
    eyebrow: "Bez datasetu není eval",
    hint: "<code>data/evals/*.jsonl</code>, <code>src/datasets/schemas.ts</code>",
    items: [
      "Jeden JSONL řádek je jeden QA case",
      "Každý case má riziko, expected behaviour a edit targets",
      "Syntetická data musí být anonymní a sdílitelná",
      "Slabý dataset vytvoří falešně zelený gate",
    ],
    code: `{
  "id": "translation-edge-placeholders-es",
  "capability": "translation",
  "caseType": "passing",
  "risk": "medium",
  "labels": ["placeholder", "ui-copy"],
  "input": { "targetLanguage": "es" },
  "expected": { "preserve": ["{count}", "<strong>"] }
}`,
    language: "json",
  },
  {
    title: "Jak vypadá lab",
    eyebrow: "Případ, výstup, skóre",
    hint: "<code>evals/*.eval.ts</code>, <code>evals/lab-utils.ts</code>",
    items: [
      "Dataset dodá konkrétní rizikový case",
      "Task volá aplikaci nebo live model",
      "Scorers rozdělí hard fail, quality signal a metadata",
      "Threshold určí QA next step",
    ],
    code: `case: mobile-search-missing-date
risk: high

výsledek:
  schema_validity       pass
  intent_classification pass
  missing_fields        review
  invented_data         fail

QA rozhodnutí:
  změnu nepustit bez opravy`,
    language: "md",
  },
  {
    title: "Deterministický scoring",
    eyebrow: "Co není věc názoru",
    hint: "<code>src/scorers/text-quality.ts</code>, <code>src/scorers/structured-output.ts</code>",
    items: [
      "Placeholdery, tagy a produktové kódy jsou hard invariants",
      "Schema, required fields a forbidden claims nejsou věc názoru",
      "Invented data patří do hard failu",
      "LLM as a Judge řeší až význam, úplnost a použitelnost",
    ],
    code: `hard gate:
schema_validity + protected_fragments + forbidden_claims`,
    language: "md",
  },
  {
    title: "LLM as a Judge",
    eyebrow: "Kritéria místo dojmu",
    hint: "<code>src/judges/rubrics.ts</code>, <code>src/judges/live-judge.ts</code>",
    items: [
      "Judge použijeme pro význam, úplnost, srozumitelnost a práci s nejistotou",
      "Rubric říká, co je pass, review a fail",
      "Jedno číslo nestačí bez dimension scores a rationale",
      "Kalibrace ověří good, bad a borderline výstupy",
      "Judge je QA signal, ne náhrada hard gates",
    ],
    code: `kritéria:
  věcná správnost     40 %
  úplnost odpovědi    30 %
  práce s nejistotou  20 %
  srozumitelnost      10 %

výsledek:
  score: 0.74
  review: chybí důležité varování`,
    language: "md",
  },
  {
    title: "Co testovat",
    eyebrow: "Rizika, která bolí v provozu",
    items: [
      "Kvalita: význam, přesnost, srozumitelnost, užitečnost",
      "Struktura: schema, intent, slots a confidence",
      "Konzistence: stejný dotaz, parafráze, změna kontextu",
      "Bezpečnost: prompt injection, nechtěný únik obsahu",
      "Release: case risk, trend, threshold a export evidence",
    ],
    code: `slot = hodnota, kterou model vytáhne ze vstupu

příklad:
input: "lety z Prahy do Madridu zítra pro 2 osoby"
intent: search_flights
slots:
  origin: Praha
  destination: Madrid
  date: zítra
  passengers: 2`,
    language: "md",
  },
  {
    title: "Threshold není dekorace",
    eyebrow: "Release gate",
    items: [
      "High-risk case může zastavit release i při dobrém průměru",
      "Borderline case jde do review, ne do slepého schválení",
      "Known failing case ověřuje, že scorer umí chytit problém",
      "Výsledek musí nést dataset, variantu, model, threshold a čas běhu",
    ],
    code: `high-risk case + nízké skóre -> stop
nízké suite score -> review
stabilní výsledek -> pokračovat`,
    language: "md",
  },
  {
    title: "Kontrola API",
    eyebrow: "Než začne první lab",
    hint: "<code>.env</code>, <code>pnpm run smoke</code>, <code>pnpm run live:check</code>",
    items: [
      "Default je live mode přes OpenRouter",
      "Model je <code>openrouter/owl-alpha</code>, pokud ho nepřepíše env",
      "Klíč je pouze v lokálním .env a nikdy se nevypisuje",
      "Smoke ověří mode, model a přítomnost klíče",
      "Live check udělá malé volání a ověří použitelný výstup",
    ],
    code: `pnpm run smoke
pnpm run live:check`,
    language: "bash",
  },
  {
    title: "Workshop model",
    eyebrow: "Prakticky, ne akademicky",
    hint: "<code>README.md</code>, <code>docs/setup.md</code>, <code>docs/labs</code>",
    items: [
      "Každý lab má source file, command, gate a QA decision",
      "Účastník čte case-level výstup, ne jen průměr",
      "Úpravy jsou malé a cílené na evidence",
      "Live model variance je součást práce QA",
    ],
    code: `pnpm run start
pnpm run lab:01
pnpm run lab:06
pnpm run eval:all
pnpm run eval:export`,
    language: "bash",
  },
  {
    title: "01 Dataset Quality",
    eyebrow: "Nejdřív oprav data",
    hint: "<code>evals/01-dataset-quality.eval.ts</code>, <code>data/evals/dataset-quality-broken.jsonl</code>",
    task: "Najděte slabá metadata a určete, jestli dataset může být release evidence",
    items: [
      "Labels a expected behaviour říkají, proč case existuje",
      "Risk a capability musí odpovídat shared schema",
      "Anonymization flags rozhodují, jestli data smí do workshopu",
      "Participant edit targets dělají case opravovatelný",
    ],
    code: `pnpm run data:check
pnpm run lab:01

gate: detected_repair_issues + repair_checklist
QA: repair dataset before scorer changes`,
    language: "bash",
  },
  {
    title: "02 Translation Guardrails",
    eyebrow: "Invarianty výstupu",
    hint: "<code>evals/02-translation-guardrails.eval.ts</code>, <code>src/scorers/text-quality.ts</code>",
    task: "Oddělte hard invariants od subjektivní kvality překladu",
    items: [
      "Placeholdery a inline tags se nesmí ztratit",
      "Product codes a glossary terms mají přesnou ochranu",
      "Forbidden phrases jsou hard fail",
      "Dobře znějící překlad nesmí obejít guardrail",
    ],
    code: `pnpm run lab:02

gate: text_guardrails + forbidden_phrases + protected_fragment_breakdown
QA: hard fail blocks release without judge debate`,
    language: "bash",
  },
  {
    title: "03 Translation Quality Judge",
    eyebrow: "Kvalita nad pravidly",
    hint: "<code>evals/03-translation-quality.eval.ts</code>, <code>src/judges/rubrics.ts</code>",
    task: "Porovnejte guardrails s judge hodnocením významu a použitelnosti",
    items: [
      "Výstup může splnit invariants a přesto poškodit význam",
      "Rubric musí ukázat dimension, která srazila score",
      "Known bad nesmí projít jen proto, že zní přirozeně",
      "QA rozlišuje hard fail, quality review a accepted risk",
    ],
    code: `pnpm run lab:03

gate: text_guardrails + rubric_judge >= 0.72
QA: low dimension score needs review reason`,
    language: "bash",
  },
  {
    title: "04 Mobile Search Intent",
    eyebrow: "Strukturovaný výstup",
    hint: "<code>evals/04-mobile-search-intent.eval.ts</code>, <code>src/apps/mobile-search.ts</code>",
    task: "Zkontrolujte intent, vytažené slots, confidence a chování při neúplném vstupu",
    items: [
      "Intent určuje další produktový krok: search, filter, sort, compare, ask",
      "Slot je konkrétní hodnota z dotazu: origin, destination, date, passengers, maxPrice",
      "Chybějící slot má skončit v missing fields, ne jako vymyšlená hodnota",
      "Missing fields chrání proti předčasné akci",
      "Confidence threshold odděluje continue od review",
    ],
    code: `pnpm run lab:04

gate: structured_output + disallowed_slots
QA: invented slot in high-risk flow = stop`,
    language: "bash",
  },
  {
    title: "05 Conversation State",
    eyebrow: "Historie mění očekávání",
    hint: "<code>evals/05-mobile-search-conversation.eval.ts</code>, <code>data/evals/mobile-search-conversation.jsonl</code>",
    task: "Ověřte, jestli model správně spojí aktuální větu s conversation history",
    items: [
      "Slots z historie nesmí přepsat aktuální instrukci",
      "Ordinal reference typu první/druhý/třetí musí ukázat na správné výsledky",
      "Změna intentu nesmí zůstat ve starém flow",
      "Nejasný odkaz má skončit jako ask_clarification",
    ],
    code: `pnpm run lab:05

edit point: data/evals/mobile-search-conversation.jsonl
gate: structured_output + conversation_state + rubric_judge >= 0.68
QA: ambiguous reference without clarification = stop`,
    language: "bash",
  },
  {
    title: "06 Live Prompt Variants",
    eyebrow: "Stejný model, jiný prompt",
    hint: "<code>evals/06-prompt-model-variants.eval.ts</code>, <code>src/variants/index.ts</code>",
    task: "Porovnejte dvě live prompt varianty nad stejnými translation cases",
    items: [
      "Obě varianty běží přes stejný OpenRouter model",
      "plain-ui-translation ukazuje riziko slabého promptu",
      "guardrailed-translation přidává explicitní invariants",
      "QA rozhoduje podle case-level failures před průměrem",
    ],
    code: `pnpm run lab:06

edit point: records.filter(...)
gate: text_guardrails + rubric_judge >= 0.68 + variant_profile
QA: better average is not enough if high-risk case fails`,
    language: "bash",
  },
  {
    title: "07 Travel Info Summary",
    eyebrow: "Jen dodaný text",
    hint: "<code>evals/07-travel-info-summary.eval.ts</code>, <code>src/scorers/summary.ts</code>",
    task: "Vyhodnoťte fakta, unsupported claims, varování a nedostatečný zdrojový text",
    items: [
      "Required facts musí být pokryté",
      "Unsupported claims jsou riziko důvěry a compliance",
      "Warnings a insufficient source musí být explicitní",
      "Sentence limit chrání použitelnost výstupu",
    ],
    code: `pnpm run lab:07

gate: source_grounded_summary + rubric_judge >= 0.72
QA: missing source information must not be invented`,
    language: "bash",
  },
  {
    title: "08 Judge Calibration",
    eyebrow: "Důvěřuj až po kalibraci",
    hint: "<code>evals/08-judge-calibration.eval.ts</code>, <code>src/judges/live-judge.ts</code>",
    task: "Ověřte, jestli good, borderline a bad příklady spadají do očekávaných pásem",
    items: [
      "Kalibrace testuje judge, ne aplikaci",
      "Known good má být pass, known bad fail",
      "Borderline case má vyvolat review",
      "Když pásma nesedí, upravujeme rubric nebo threshold",
    ],
    code: `pnpm run lab:08

gate: calibration_band
QA: uncalibrated judge is not a release gate`,
    language: "bash",
  },
  {
    title: "09 Prompt Injection",
    eyebrow: "Instrukce versus data",
    hint: "<code>evals/09-prompt-injection.eval.ts</code>, <code>src/scorers/safety.ts</code>",
    task: "Ověřte, že systém ignoruje instrukce vložené do dodaného textu",
    items: [
      "Instruction override nesmí změnit systémové chování",
      "System-like content nesmí uniknout do odpovědi",
      "Schema bypass je hard fail",
      "Allowed content a forbidden behaviour musí být oddělené",
    ],
    code: `pnpm run lab:09

gate: safety_guardrails + rubric_judge >= 0.72
QA: leakage or secret-like output = stop`,
    language: "bash",
  },
  {
    title: "10 Consistency Regression",
    eyebrow: "Regrese v nedeterminismu",
    hint: "<code>evals/10-consistency-regression.eval.ts</code>, <code>src/scorers/consistency.ts</code>",
    task: "Rozhodněte, které rozdíly jsou formulace a které už mění chování",
    items: [
      "Parafráze má zachovat intent a business meaning",
      "Repeated-run variance je signál stability",
      "Baseline regression ukazuje zhoršení proti předchozímu stavu",
      "High-risk override může zastavit i lokální zlepšení",
    ],
    code: `pnpm run lab:10

gate: consistency + regression_gate
QA: behaviour drift in high-risk case = stop`,
    language: "bash",
  },
  {
    title: "11 Agentic Eval Authoring",
    eyebrow: "QA akcelerace s kontrolou",
    hint: "<code>evals/11-agentic-eval-authoring.eval.ts</code>, <code>data/evals/agent-authored-summary.jsonl</code>",
    task: "Zadejte agentovi úzký eval-authoring úkol a rozhodněte, jestli výsledek může do QA evidence",
    items: [
      "Agentic work je vážný QA acceleration pattern",
      "QA vlastní risk, expected behaviour, threshold a review hint",
      "Agent smí navrhnout case a scorer check v jasném scope",
      "Diff a výsledky gate jsou povinná evidence",
    ],
    code: `pnpm run data:check
pnpm run lab:11

gate: source_grounded_summary + rubric_judge + dataset_authoring_review
QA: agent diff without reviewable metadata = reject`,
    language: "bash",
  },
  {
    title: "Agent jako QA lane",
    eyebrow: "Ne autopilot",
    hint: "<code>docs/agent-prompts/lab-11-agentic-eval-authoring.md</code>",
    items: [
      "Agent dostává konkrétní goal, allowed files a gate",
      "QA nepředává odpovědnost za kritéria",
      "Výstup agenta je draft, ne automatické schválení",
      "Seriózní pattern: rychlejší authoring, stejně přísné review",
    ],
    code: `agent task:
- add 1 synthetic case
- add 1 focused scorer check
- keep data anonymized
- run data:check and lab:11`,
    language: "md",
  },
  {
    title: "Evidence po workshopu",
    eyebrow: "Co patří do release procesu",
    items: [
      "Dataset verze a risk coverage",
      "Model, prompt variant, threshold a run time",
      "Failing cases s konkrétním scorer důvodem",
      "Export pro audit, bug report nebo release sign-off",
    ],
    code: `pnpm run eval:all
pnpm run eval:export`,
    language: "bash",
  },
  {
    title: "Nástroje: co patří do repertoáru",
    eyebrow: "Ne jeden tool, ale stack",
    items: [
      "Eval harness: repo-first testy nad datasety, scorery a thresholdy",
      "Observability: tracing, prompt/model verze, produkční příklady a feedback",
      "Red teaming: prompt injection, leakage, jailbreak a schema bypass sady",
      "Collaboration: prompt playground, test history, review workflow",
      "Governance: AGENTS.md, CODEOWNERS, CI gate a auditovatelná evidence",
    ],
    code: `core stack:
  Evalite     -> evals jako kód
  Langfuse    -> traces, datasets, feedback
  Promptfoo   -> red team + model/prompt matrix
  LangTail    -> volitelný prompt playground pro product/QA`,
    language: "md",
  },
  {
    title: "Doporučený směr pro vás",
    eyebrow: "AI-native tým + coding agents",
    items: [
      "Source of truth držet v GitLabu, ne v externím dashboardu",
      "Každá změna promptu/modelu/RAG logiky má přidat nebo aktualizovat eval case",
      "Produkční failure se stává regression case",
      "Coding agent může psát návrhy datasetů/scorerů, QA drží risk a schválení",
      "Dashboard používat na debug a sběr dat; release gate běží v CI",
    ],
    code: `release loop:
production traces
  -> curated dataset
  -> Evalite regression suite
  -> Promptfoo safety suite
  -> GitLab CI gate
  -> QA continue / review / stop`,
    language: "md",
  },
  {
    title: "Co si odnést",
    eyebrow: "QA proces",
    items: [
      "Dataset je QA produkt, ne vedlejší soubor",
      "Hard gates patří před LLM judge",
      "Judge bez kalibrace je jen review signal",
      "Live OpenRouter výsledky vyžadují case-level čtení",
      "Agent zrychlí authoring, QA drží rozhodnutí",
      "Eval evidence má vést k continue / review / stop",
    ],
    center: true,
  },
  {
    title: "Diskuse",
    eyebrow: "Q&A",
    center: true,
  },
];

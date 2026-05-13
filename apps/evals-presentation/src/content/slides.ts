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
    eyebrow: "QA rozhodování nad AI",
    items: [
      "Zachytit regresi dřív než ji uvidí uživatel",
      "Rozhodnout, kdy výstup pustit dál a kdy blokovat změnu",
      "Porovnat prompt nebo model na stejných datech",
      "Mít evidence místo dojmů",
    ],
    note: "Cíl: postavit praktický eval proces, který pomáhá testerům dělat lepší rozhodnutí",
    center: true,
  },
  {
    title: "Proč to QA řeší",
    eyebrow: "Byznysová hodnota",
    items: [
      "AI chyba často nevypadá jako crash, ale jako přesvědčivě špatná odpověď",
      "Ruční kontrola pár promptů nedává ochranu před regresí",
      "Model, prompt i data se mohou změnit kdykoliv",
      "Evaly dávají týmu opakovatelný způsob, jak měřit riziko",
    ],
    code: `bez evalů:  vypadá to dobře -> pustíme
s evaly:    máme data + score + konkrétní selhání -> rozhodneme`,
    language: "md",
  },
  {
    title: "Evals nejsou unit testy",
    eyebrow: "Základní mentální model",
    items: [
      "Nehledáme jednu ideální větu",
      "Měříme chování na sadě případů",
      "Score je signál pro rozhodnutí",
      "Každý failing nebo borderline case musí být čitelný",
    ],
    code: `unit test:  output === expected
eval:       score(output, expected, context) >= threshold

release:    risk + trend + evidence`,
    language: "md",
  },
  {
    title: "Data jsou základ",
    eyebrow: "Bez datasetu není eval",
    hint: "<code>data/evals/*.jsonl</code>, <code>src/datasets/schemas.ts</code>",
    items: [
      "Každý řádek je jeden reálný typ situace, kterou chce QA hlídat",
      "Metadata určují riziko, štítky a očekávané chování",
      "Dataset má být anonymní a bezpečně sdílitelný",
      "Špatně popsaný případ vytvoří falešnou jistotu",
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
    title: "Tvar labu",
    eyebrow: "Případ, výstup, skóre",
    hint: "<code>evals/*.eval.ts</code>, <code>evals/lab-utils.ts</code>",
    items: [
      "Dataset dodá případy",
      "Task zavolá reálný model přes API",
      "Scorery vyhodnotí tvrdá pravidla i kvalitu",
      "Threshold rozhodne, zda výsledek stačí pro další krok",
    ],
    code: `evalite<Input, Output, Expected>("Lab NN", {
  data,
  task: (input) => appVariant(input),
  scorers: [
    preservePlaceholders(),
    forbidUnsupportedClaims(),
    createJudgeScorer({ rubric: () => "summary" }),
  ],
});`,
    language: "ts",
  },
  {
    title: "Tvrdé scorery první",
    eyebrow: "Deterministická pravidla",
    hint: "<code>src/scorers/text-quality.ts</code>, <code>src/scorers/structured-output.ts</code>",
    items: [
      "Placeholdery, tagy a kódy musí přežít přesně",
      "Schema a povinná pole nejsou věc názoru",
      "Zakázané fráze a vymyšlená data patří do hard failu",
      "Judge má řešit až to, co nejde rozumně zapsat jako pravidlo",
    ],
    code: `const score = average([
  preservePlaceholders(output, expected),
  preserveTags(output, expected),
  forbidPatterns(output, expected),
  matchGlossary(output, expected),
]);`,
    language: "ts",
  },
  {
    title: "LLM as a Judge",
    eyebrow: "Rubrika místo dojmu",
    hint: "<code>src/judges/rubrics.ts</code>, <code>src/judges/live-judge.ts</code>",
    items: [
      "Judge musí dostat rubriku, ne volnou prosbu",
      "Dimenze skóre musí být viditelné",
      "Kalibrační příklady jsou povinná brzda",
      "Judge je pomocník pro posouzení kvality, ne náhrada tvrdých pravidel",
    ],
    code: `const rubric = {
  id: "summary",
  dimensions: [
    { id: "fact_coverage", weight: 0.4 },
    { id: "unsupported_claims", weight: 0.3 },
    { id: "uncertainty", weight: 0.2 },
    { id: "clarity", weight: 0.1 },
  ],
};`,
    language: "ts",
  },
  {
    title: "Co testovat",
    eyebrow: "Rizika, která bolí v provozu",
    items: [
      "Kvalita: význam, přesnost, srozumitelnost, užitečnost",
      "Struktura: schema, intent, slots, confidence",
      "Konzistence: stejný dotaz, parafráze, změna kontextu",
      "Bezpečnost: instrukce vložené v datech, nechtěný únik obsahu",
      "Release signály: score, riziko případu, trend proti minulé verzi",
    ],
  },
  {
    title: "Threshold není dekorace",
    eyebrow: "Release gate",
    items: [
      "Průměr suite nesmí schovat high-risk selhání",
      "Borderline case má vyvolat review, ne paniku",
      "Failing case má potvrdit, že scorer opravdu kouše",
      "Výsledek musí být dohledatelný: dataset, varianta, threshold, čas běhu",
    ],
    code: `if (caseRisk === "high" && score < 0.8) {
  return "block";
}

if (suiteScore < threshold) {
  return "review";
}

return "continue";`,
    language: "ts",
  },
  {
    title: "Kontrola Live API",
    eyebrow: "Než začne první lab",
    hint: "<code>.env</code>, <code>pnpm run smoke</code>, <code>pnpm run live:check</code>",
    items: [
      "Používáme OpenRouter a free model openrouter/owl-alpha",
      "Klíč je pouze v lokálním .env a nikdy se nevypisuje",
      "Smoke ověří live režim, model a přítomnost klíče",
      "Live check udělá malý request a ověří, že model vrací použitelný výstup",
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
      "Účastník spouští command, čte výstup a dělá malé editace",
      "Cílem je vyhodnotit chování, ne programovat aplikaci od nuly",
      "Každý lab má konkrétní soubor, příkaz a QA rozhodnutí",
      "Výsledky z live modelu jsou součást diskuse o riziku",
    ],
    code: `pnpm run start
pnpm run lab:01
pnpm run lab:09
pnpm run eval:all
pnpm run eval:export`,
    language: "bash",
  },
  {
    title: "01 Dataset Quality",
    eyebrow: "Nejdřív oprav data",
    hint: "<code>evals/01-dataset-quality.eval.ts</code>, <code>data/evals/dataset-quality-broken.jsonl</code>",
    task: "Najděte rozbité metadata a určete, co má být automatická kontrola a co lidské review",
    items: [
      "Prázdné štítky",
      "Neplatné capability a risk hodnoty",
      "Chybějící očekávané chování",
      "Nesmyslné thresholdy",
    ],
  },
  {
    title: "02 Translation Guardrails",
    eyebrow: "Invarianty výstupu",
    hint: "<code>evals/02-translation-guardrails.eval.ts</code>, <code>src/scorers/text-quality.ts</code>",
    task: "Oddělte pravidla, která musí projít přesně, od subjektivní kvality textu",
    items: [
      "Placeholdery",
      "HTML-like tagy",
      "Produktové kódy",
      "Zakázané fráze",
      "Glosářové termíny",
    ],
  },
  {
    title: "03 Translation Judge",
    eyebrow: "Kvalita nad pravidly",
    hint: "<code>evals/03-translation-quality.eval.ts</code>, <code>src/judges/rubrics.ts</code>",
    task: "Porovnejte tvrdé guardraily s rubrikou pro význam a použitelnost",
    items: [
      "Výstup může zachovat tagy a přesto být špatný",
      "Judge score musí ukazovat dimenze",
      "Známý špatný případ nesmí projít jen díky hezké formulaci",
      "Tester musí umět rozlišit pravidlo, kvalitu a riziko",
    ],
  },
  {
    title: "04 Mobile Search Intent",
    eyebrow: "Strukturovaný výstup",
    hint: "<code>evals/04-mobile-search-intent.eval.ts</code>, <code>src/apps/mobile-search.ts</code>",
    task: "Zkontrolujte intent, slots, confidence a chování při neúplném vstupu",
    items: [
      "Schema validace",
      "Intent classification",
      "Missing fields",
      "Invented data",
      "Confidence threshold",
    ],
  },
  {
    title: "05 Conversation State",
    eyebrow: "Historie mění očekávání",
    hint: "<code>evals/05-mobile-search-conversation.eval.ts</code>, <code>data/evals/mobile-search-conversation.jsonl</code>",
    task: "Rozhodněte, kdy má model nést kontext a kdy se musí doptat",
    items: [
      "Navázání na předchozí tah",
      "Ordinal reference",
      "Změna intentu",
      "Ambiguita",
      "Follow-up otázka",
    ],
  },
  {
    title: "06 Variants",
    eyebrow: "Prompt nebo model změna",
    hint: "<code>evals/06-prompt-model-variants.eval.ts</code>, <code>src/variants/index.ts</code>",
    task: "Porovnejte varianty na stejných případech a najděte regresi schovanou v průměru",
    items: [
      "Stejný dataset pro všechny varianty",
      "Case-by-case diff před aggregate skóre",
      "Levnější varianta musí mít hranice použití",
      "Změna promptu je release změna",
    ],
  },
  {
    title: "07 Summary",
    eyebrow: "Jen dodaný text",
    hint: "<code>evals/07-travel-info-summary.eval.ts</code>, <code>src/scorers/summary.ts</code>",
    task: "Vyhodnoťte fakta, unsupported claims, varování a nedostatečný zdrojový text",
    items: [
      "Required facts",
      "Forbidden claims",
      "Warning coverage",
      "Uncertainty handling",
      "Sentence limit",
    ],
  },
  {
    title: "08 Judge Calibration",
    eyebrow: "Důvěřuj až po kalibraci",
    hint: "<code>evals/08-judge-calibration.eval.ts</code>, <code>src/judges/live-judge.ts</code>",
    task: "Ověřte, že známý dobrý, špatný a borderline výstup padá do správného pásma",
    items: [
      "Known good",
      "Known bad",
      "Borderline",
      "Dimenze skóre",
      "Kdy je judge dostatečně kalibrovaný pro review",
    ],
  },
  {
    title: "09 Prompt Injection",
    eyebrow: "Instrukce versus data",
    hint: "<code>evals/09-prompt-injection.eval.ts</code>, <code>src/scorers/safety.ts</code>",
    task: "Ověřte, že systém ignoruje instrukce vložené do dodaného textu a neuniká interní obsah",
    items: [
      "Instruction override",
      "System-like leakage",
      "Schema bypass",
      "Secret-like output",
      "Povolený obsah versus zakázané chování",
    ],
  },
  {
    title: "10 Consistency",
    eyebrow: "Regrese v nedeterminismu",
    hint: "<code>evals/10-consistency-regression.eval.ts</code>, <code>src/scorers/consistency.ts</code>",
    task: "Rozhodněte, které rozdíly jsou jen formulace a které už mění chování",
    items: [
      "Parafráze se stejným významem",
      "Repeated-run variance",
      "Baseline regression",
      "High-risk override",
      "Export evidence",
    ],
  },
  {
    title: "Co si odnést",
    eyebrow: "QA proces",
    items: [
      "Sbírat dobré případy je práce QA, ne vedlejší artefakt",
      "Tvrdá pravidla patří před judge",
      "Judge bez kalibrace není release gate",
      "Varianty se porovnávají na stejných datech",
      "Výsledek evalů musí být evidence pro rozhodnutí",
    ],
    center: true,
  },
  {
    title: "Diskuse",
    eyebrow: "Q&A",
    center: true,
  },
];

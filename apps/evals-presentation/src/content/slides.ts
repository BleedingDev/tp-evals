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
      "Zachytit regresi dřív než ji uvidí uživatel",
      "Rozhodnout, kdy výstup pustit dál a kdy blokovat změnu",
      "Porovnat prompt i model na stejném datasetu",
      "Opřít se o důkazy, ne o dojem z několika ukázek",
    ],
    note: "Cíl: ukázat praktický eval proces, který testerům pomůže opakovaně hodnotit chování AI",
    center: true,
  },
  {
    title: "Proč to QA řeší",
    eyebrow: "Byznysová hodnota",
    items: [
      "AI chyba často nevypadá jako pád aplikace, ale jako přesvědčivě špatná odpověď",
      "Ruční kontrola pár promptů neochrání tým před regresí",
      "Model, prompt i data se mohou změnit kdykoliv",
      "Evaly dávají týmu opakovatelný způsob, jak měřit riziko",
    ],
    code: `bez evalů:  vypadá to dobře -> pustíme
s evaly:    máme dataset + skóre + konkrétní selhání -> rozhodneme`,
    language: "md",
  },
  {
    title: "Evals nejsou unit testy",
    eyebrow: "Základní mentální model",
    items: [
      "Nehledáme jednu ideální větu",
      "Měříme chování na sadě případů",
      "Score je signál pro rozhodnutí, ne samoúčelná metrika",
      "Každý failing nebo borderline case musí být pro testera čitelný",
    ],
    code: `unit test:  výsledek je přesně stejný
eval:       score říká, jestli je výsledek dost dobrý

rozhodnutí: riziko + trend + konkrétní selhání`,
    language: "md",
  },
  {
    title: "Data jsou základ",
    eyebrow: "Bez datasetu není eval",
    hint: "<code>data/evals/*.jsonl</code>, <code>src/datasets/schemas.ts</code>",
    items: [
      "Každý řádek je jeden typ situace, kterou chce QA hlídat",
      "U každého případu musí být jasné riziko a očekávané chování",
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
    title: "Jak vypadá lab",
    eyebrow: "Případ, výstup, skóre",
    hint: "<code>evals/*.eval.ts</code>, <code>evals/lab-utils.ts</code>",
    items: [
      "Dataset dodá konkrétní case",
      "Task zavolá reálný model přes API",
      "Scorery zkontrolují guardrails i kvalitu",
      "Threshold určí, jestli výsledek stačí pro další krok",
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
    title: "Deterministický scoring první",
    eyebrow: "Co není věc názoru",
    hint: "<code>src/scorers/text-quality.ts</code>, <code>src/scorers/structured-output.ts</code>",
    items: [
      "Placeholdery jako {{count}} se nesmí přepsat ani ztratit",
      "Tagy typu &lt;strong&gt; a produktové kódy jako KIT-42 musí zůstat přesně stejné",
      "Schema a povinná pole nejsou věc názoru",
      "Zakázané fráze a vymyšlená data patří do hard failu",
      "LLM as a Judge má řešit až věci, které nejdou rozumně zapsat pravidlem",
    ],
    code: `kontrola placeholderů
kontrola tagů
kontrola zakázaných tvrzení
kontrola povinných termínů`,
    language: "md",
  },
  {
    title: "LLM as a Judge",
    eyebrow: "Kritéria místo dojmu",
    hint: "<code>src/judges/rubrics.ts</code>, <code>src/judges/live-judge.ts</code>",
    items: [
      "Judge použijeme tam, kde nestačí pevné pravidlo: význam, úplnost, srozumitelnost",
      "Kritéria říkají, podle čeho se odpověď hodnotí a co už je problém",
      "Jedno číslo nestačí: výsledek musí ukázat, které kritérium score zhoršilo",
      "Kalibrační příklady ověří, že good, bad a borderline výstupy padají do správných pásem",
      "Judge je další signál pro QA rozhodnutí, ne náhrada deterministických scorerů",
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
      "Release signály: score, riziko případu, trend proti minulé verzi",
    ],
  },
  {
    title: "Threshold není dekorace",
    eyebrow: "Release gate",
    items: [
      "Průměr celé eval suity nesmí schovat selhání u high-risk případu",
      "Borderline case má vyvolat review, ne paniku",
      "Failing case je tam schválně: má ukázat, že scorer zachytí skutečný problém",
      "Výsledek musí jít dohledat: dataset, varianta, threshold, čas běhu",
    ],
    code: `high-risk case + nízké skóre -> stop
nízký suite score -> review
stabilní výsledek -> pokračovat`,
    language: "md",
  },
  {
    title: "Kontrola API",
    eyebrow: "Než začne první lab",
    hint: "<code>.env</code>, <code>pnpm run smoke</code>, <code>pnpm run live:check</code>",
    items: [
      "Používáme OpenRouter a model openrouter/owl-alpha",
      "Klíč je pouze v lokálním .env a nikdy se nevypisuje",
      "Rychlá kontrola ověří režim, model a přítomnost klíče",
      "Kontrolní volání ověří, že model vrací použitelný výstup",
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
      "Účastník spouští command, čte výstup a dělá malé úpravy",
      "Cílem je vyhodnotit chování, ne programovat aplikaci od nuly",
      "Každý lab má konkrétní soubor, příkaz a QA rozhodnutí",
      "Výsledky z reálného modelu jsou součást diskuse o riziku",
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
    task: "Najděte špatně popsaná metadata a určete, co má hlídat automat a co člověk",
    items: [
      "Prázdné štítky",
      "Neplatné capability nebo risk hodnoty",
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
      "Placeholdery typu {{count}}",
      "Tagy typu &lt;strong&gt;",
      "Produktové kódy",
      "Zakázané fráze",
      "Glosářové termíny",
    ],
  },
  {
    title: "03 Translation Quality Judge",
    eyebrow: "Kvalita nad pravidly",
    hint: "<code>evals/03-translation-quality.eval.ts</code>, <code>src/judges/rubrics.ts</code>",
    task: "Porovnejte guardrails s judge hodnocením významu a použitelnosti",
    items: [
      "Výstup může zachovat tagy a přesto být špatný",
      "Judge score musí ukázat důvod, ne jen jedno číslo",
      "Známý špatný případ nesmí projít jen proto, že zní dobře",
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
      "Ordinal reference: první, druhý, třetí",
      "Změna intentu",
      "Nejasné zadání",
      "Follow-up otázka",
    ],
  },
  {
    title: "06 Prompt And Model Variants",
    eyebrow: "Prompt nebo model",
    hint: "<code>evals/06-prompt-model-variants.eval.ts</code>, <code>src/variants/index.ts</code>",
    task: "Porovnejte varianty na stejných případech a najděte regresi schovanou v průměru",
    items: [
      "Stejný dataset pro všechny varianty",
      "Nejdřív case-by-case diff, až potom průměr",
      "Levnější varianta musí mít hranice použití",
      "Změna promptu je změna chování aplikace",
    ],
  },
  {
    title: "07 Travel Info Summary",
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
    task: "Ověřte, že known good, known bad a borderline výstup padá do správného pásma",
    items: [
      "Known good",
      "Known bad",
      "Borderline",
      "Score po dimenzích",
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
    title: "10 Consistency Regression",
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
      "Sbírat dobré případy je práce QA, ne vedlejší aktivita",
      "Deterministické scorery patří před judge",
      "Judge bez kalibrace není release gate",
      "Varianty se porovnávají na stejných datech",
      "Výsledek evalů musí být důkaz pro rozhodnutí",
    ],
    center: true,
  },
  {
    title: "Diskuse",
    eyebrow: "Q&A",
    center: true,
  },
];

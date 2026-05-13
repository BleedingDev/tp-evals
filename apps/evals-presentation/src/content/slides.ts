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
    eyebrow: "Praktické hodnocení výstupů",
    items: [
      "Zachytit regresi dřív než ji uvidí uživatel",
      "Rozhodnout, kdy výstup pustit dál a kdy blokovat změnu",
      "Porovnat zadání pro model nebo samotný model na stejných datech",
      "Opřít se o důkazy, ne o dojem z několika ukázek",
    ],
    note: "Cíl: ukázat postup, který testerům pomůže opakovaně hodnotit chování AI",
    center: true,
  },
  {
    title: "Proč to QA řeší",
    eyebrow: "Byznysová hodnota",
    items: [
      "AI chyba často nevypadá jako pád aplikace, ale jako přesvědčivě špatná odpověď",
      "Ruční kontrola pár dotazů neochrání tým před regresí",
      "Model, zadání i data se mohou změnit kdykoliv",
      "Evaly dávají týmu opakovatelný způsob, jak měřit riziko",
    ],
    code: `bez evalů:  vypadá to dobře -> pustíme
s evaly:    máme případy + výsledky + konkrétní selhání -> rozhodneme`,
    language: "md",
  },
  {
    title: "Eval není běžný test",
    eyebrow: "Základní princip",
    items: [
      "Nehledáme jednu ideální větu",
      "Měříme chování na sadě případů",
      "Výsledek hodnocení je podklad pro rozhodnutí",
      "Každý špatný nebo hraniční případ musí být srozumitelný",
    ],
    code: `běžný test: výsledek je přesně stejný
eval:       výsledek je dost dobrý podle dohodnutých pravidel

rozhodnutí: riziko + trend + konkrétní selhání`,
    language: "md",
  },
  {
    title: "Data jsou základ",
    eyebrow: "Bez sady případů není eval",
    hint: "<code>data/evals/*.jsonl</code>, <code>src/datasets/schemas.ts</code>",
    items: [
      "Každý řádek je jeden typ situace, kterou chce QA hlídat",
      "U každého případu musí být jasné riziko a očekávané chování",
      "Sada případů má být anonymní a bezpečně sdílitelná",
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
    title: "Jak vypadá cvičení",
    eyebrow: "Případ, výstup, skóre",
    hint: "<code>evals/*.eval.ts</code>, <code>evals/lab-utils.ts</code>",
    items: [
      "Sada dat dodá konkrétní případy",
      "Cvičení zavolá reálný model přes API",
      "Hodnoticí pravidla zkontrolují pevné požadavky i kvalitu",
      "Hranice úspěchu určí, zda výsledek stačí pro další krok",
    ],
    code: `1. vezmi připravený případ
2. zavolej model
3. zkontroluj výstup
4. ukaž, co prošlo a co selhalo`,
    language: "md",
  },
  {
    title: "Nejdřív pevná pravidla",
    eyebrow: "Co není věc názoru",
    hint: "<code>src/scorers/text-quality.ts</code>, <code>src/scorers/structured-output.ts</code>",
    items: [
      "Zástupné značky jako {{count}} se nesmí přepsat ani ztratit",
      "Značky typu <strong> a kódy jako KIT-42 musí zůstat přesně stejné",
      "Povinné položky v odpovědi nesmí chybět",
      "Vymyšlená data a zakázané formulace mají být jasné selhání",
      "Model jako hodnotitel má řešit až věci, které nejdou jednoduše zapsat pravidlem",
    ],
    code: `kontrola zástupných značek
kontrola značek v textu
kontrola zakázaných tvrzení
kontrola povinných termínů`,
    language: "md",
  },
  {
    title: "Model jako hodnotitel",
    eyebrow: "Kritéria místo dojmu",
    hint: "<code>src/judges/rubrics.ts</code>, <code>src/judges/live-judge.ts</code>",
    items: [
      "Model musí vědět, podle čeho má odpověď posoudit",
      "Ve výsledku musí být vidět, proč odpověď prošla nebo selhala",
      "Známé dobré a špatné příklady pomáhají držet hodnocení při zemi",
      "Model hodnotí kvalitu textu, ale nenahrazuje pevné kontroly",
    ],
    code: `Hodnotíme:
- drží se dodaného textu
- nepřidává vymyšlená tvrzení
- přizná nejistotu
- odpoví stručně a jasně`,
    language: "md",
  },
  {
    title: "Co testovat",
    eyebrow: "Rizika, která bolí v provozu",
    items: [
      "Kvalita: význam, přesnost, srozumitelnost, užitečnost",
      "Tvar odpovědi: správný záměr, vyplněné údaje a jistota modelu",
      "Konzistence: stejný dotaz, parafráze, změna kontextu",
      "Bezpečnost: instrukce vložené v datech, nechtěný únik obsahu",
      "Rozhodnutí o nasazení: skóre, riziko případu, trend proti minulé verzi",
    ],
  },
  {
    title: "Hranice úspěchu",
    eyebrow: "Kdy zastavit změnu",
    items: [
      "Průměr nesmí schovat selhání ve vysoce rizikovém případu",
      "Hraniční případ má vyvolat kontrolu, ne paniku",
      "Záměrně špatný případ ověřuje, že pravidlo opravdu odhalí problém",
      "Výsledek musí jít dohledat: data, varianta, hranice, čas běhu",
    ],
    code: `vysoké riziko + nízké skóre -> zastavit
nízký průměr celé sady -> zkontrolovat
stabilní výsledek -> pokračovat`,
    language: "md",
  },
  {
    title: "Kontrola API",
    eyebrow: "Než začne první cvičení",
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
    title: "Jak budeme pracovat",
    eyebrow: "Prakticky, ne akademicky",
    hint: "<code>README.md</code>, <code>docs/setup.md</code>, <code>docs/labs</code>",
    items: [
      "Účastník spouští příkaz, čte výstup a dělá malé úpravy",
      "Cílem je vyhodnotit chování, ne programovat aplikaci od nuly",
      "Každé cvičení má konkrétní soubor, příkaz a rozhodnutí testera",
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
    title: "01 Kvalita dat",
    eyebrow: "Nejdřív oprav data",
    hint: "<code>evals/01-dataset-quality.eval.ts</code>, <code>data/evals/dataset-quality-broken.jsonl</code>",
    task: "Najděte špatně popsané případy a určete, co má hlídat automat a co člověk",
    items: [
      "Prázdné štítky",
      "Neplatný typ úlohy nebo rizika",
      "Chybějící očekávané chování",
      "Nesmyslné hranice hodnocení",
    ],
  },
  {
    title: "02 Překlady",
    eyebrow: "Co se nesmí rozbít",
    hint: "<code>evals/02-translation-guardrails.eval.ts</code>, <code>src/scorers/text-quality.ts</code>",
    task: "Oddělte pravidla, která musí projít přesně, od subjektivní kvality textu",
    items: [
      "Zástupné značky typu {{count}}",
      "Značky typu <strong>",
      "Produktové kódy",
      "Zakázané fráze",
      "Povinné termíny ze slovníku",
    ],
  },
  {
    title: "03 Kvalita překladu",
    eyebrow: "Kvalita nad pravidly",
    hint: "<code>evals/03-translation-quality.eval.ts</code>, <code>src/judges/rubrics.ts</code>",
    task: "Porovnejte pevná pravidla s hodnocením významu a použitelnosti",
    items: [
      "Výstup může zachovat značky a přesto být špatný",
      "Hodnocení musí ukázat důvod, ne jen jedno číslo",
      "Známý špatný případ nesmí projít jen proto, že zní dobře",
      "Tester musí umět rozlišit pravidlo, kvalitu a riziko",
    ],
  },
  {
    title: "04 Vyhledávání v mobilu",
    eyebrow: "Strukturovaný výstup",
    hint: "<code>evals/04-mobile-search-intent.eval.ts</code>, <code>src/apps/mobile-search.ts</code>",
    task: "Zkontrolujte, co chce uživatel udělat, jaké údaje model získal z dotazu a co udělá při neúplném vstupu",
    items: [
      "Odpověď má předepsaný tvar",
      "Správně rozpoznaný záměr",
      "Chybějící údaje",
      "Vymyšlené údaje",
      "Jistota modelu",
    ],
  },
  {
    title: "05 Kontext konverzace",
    eyebrow: "Historie mění očekávání",
    hint: "<code>evals/05-mobile-search-conversation.eval.ts</code>, <code>data/evals/mobile-search-conversation.jsonl</code>",
    task: "Rozhodněte, kdy má model nést kontext a kdy se musí doptat",
    items: [
      "Navázání na předchozí tah",
      "Odkazy typu první, druhý, třetí",
      "Změna záměru",
      "Nejasné zadání",
      "Doplňující otázka",
    ],
  },
  {
    title: "06 Varianty",
    eyebrow: "Zadání nebo model",
    hint: "<code>evals/06-prompt-model-variants.eval.ts</code>, <code>src/variants/index.ts</code>",
    task: "Porovnejte varianty na stejných případech a najděte regresi schovanou v průměru",
    items: [
      "Stejná sada případů pro všechny varianty",
      "Nejdřív porovnat jednotlivé případy, až potom průměr",
      "Levnější varianta musí mít hranice použití",
      "Změna zadání pro model je změna chování aplikace",
    ],
  },
  {
    title: "07 Shrnutí textu",
    eyebrow: "Jen dodaný text",
    hint: "<code>evals/07-travel-info-summary.eval.ts</code>, <code>src/scorers/summary.ts</code>",
    task: "Vyhodnoťte fakta, vymyšlená tvrzení, varování a nedostatečný zdrojový text",
    items: [
      "Povinná fakta",
      "Zakázaná tvrzení",
      "Zachycení varování",
      "Práce s nejistotou",
      "Limit počtu vět",
    ],
  },
  {
    title: "08 Kalibrace hodnocení",
    eyebrow: "Důvěřuj až po ověření",
    hint: "<code>evals/08-judge-calibration.eval.ts</code>, <code>src/judges/live-judge.ts</code>",
    task: "Ověřte, že známý dobrý, špatný a hraniční výstup patří do správného pásma",
    items: [
      "Známý dobrý výstup",
      "Známý špatný výstup",
      "Hraniční výstup",
      "Důvody hodnocení",
      "Kdy je hodnocení použitelné pro kontrolu",
    ],
  },
  {
    title: "09 Vložené instrukce",
    eyebrow: "Instrukce versus data",
    hint: "<code>evals/09-prompt-injection.eval.ts</code>, <code>src/scorers/safety.ts</code>",
    task: "Ověřte, že systém ignoruje instrukce vložené do dodaného textu a neuniká interní obsah",
    items: [
      "Pokus přepsat zadání",
      "Únik interních instrukcí",
      "Obcházení očekávaného tvaru odpovědi",
      "Výstup, který vypadá jako citlivý obsah",
      "Povolený obsah versus zakázané chování",
    ],
  },
  {
    title: "10 Konzistence",
    eyebrow: "Když odpovědi kolísají",
    hint: "<code>evals/10-consistency-regression.eval.ts</code>, <code>src/scorers/consistency.ts</code>",
    task: "Rozhodněte, které rozdíly jsou jen formulace a které už mění chování",
    items: [
      "Jiné formulace se stejným významem",
      "Rozdíly mezi opakovanými běhy",
      "Zhoršení proti předchozí verzi",
      "Vysoce rizikový případ má přednost před průměrem",
      "Důkazy pro rozhodnutí",
    ],
  },
  {
    title: "Co si odnést",
    eyebrow: "QA postup",
    items: [
      "Sbírat dobré případy je práce QA, ne vedlejší aktivita",
      "Pevná pravidla mají přijít před hodnocení modelem",
      "Hodnocení modelem bez ověření nesmí rozhodovat o nasazení",
      "Varianty se porovnávají na stejných datech",
      "Výsledek evalů musí být důkaz pro rozhodnutí",
    ],
    center: true,
  },
  {
    title: "Diskuse",
    eyebrow: "Otázky",
    center: true,
  },
];

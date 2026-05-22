import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  readFile,
  readdir,
  stat,
} from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import { loadWorkshopEnv } from "../src/env";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadWorkshopEnv(rootDir);
const evaliteBin = resolve(rootDir, "node_modules", "evalite", "dist", "bin.js");
const objectRecordSchema = z.record(z.string(), z.unknown());
type WorkshopMode = "live" | "mock";

type LabDefinition = {
  readonly command: `lab:${string}`;
  readonly file: string;
  readonly label: string;
  readonly runtime: string;
  readonly anchorCase: string;
  readonly open: readonly string[];
  readonly read: readonly string[];
  readonly edit: string;
  readonly expectedSignal: string;
  readonly reset: string;
  readonly qaDecision: string;
};

const labs = [
  {
    command: "lab:01",
    file: "evals/01-dataset-quality.eval.ts",
    label: "Lab 01",
    runtime: "local deterministic",
    anchorCase: "translation-cancel-booking-incomplete",
    open: [
      ".evalite/results/lab-01.json",
      "data/evals/dataset-quality-broken.jsonl",
    ],
    read: ["rowStatus", "fixPlan", "detectedIssueTypes", "suggestedFixes"],
    edit: "Navrhněte minimální fix pro jeden rozbitý dataset row.",
    expectedSignal: "Audit ukáže, co je rozbité; zelená znamená správnou detekci vad.",
    reset: "Nechte fixture dataset v rozbitém stavu, pokud nejde o řízený lektorský diff.",
    qaDecision: "Je dataset blokující, review-only, nebo připravený pro gate?",
  },
  {
    command: "lab:02",
    file: "evals/02-translation-guardrails.eval.ts",
    label: "Lab 02",
    runtime: "live generation + deterministic scorers",
    anchorCase: "translation-edge-tags-fr; experiment: translation-edge-placeholders-es",
    open: [
      ".evalite/results/lab-02.json",
      "data/evals/translations-edge-cases.jsonl",
    ],
    read: ["output.text", "scores", "expected.mustPreserve", "expected.forbiddenPatterns"],
    edit: "Do input.placeholders u translation-edge-placeholders-es přidejte {{missing_placeholder}}.",
    expectedSignal: "Stejný case začne čekat placeholder, který output neobsahuje, a guard score spadne.",
    reset: "Po experimentu {{missing_placeholder}} zase odeberte.",
    qaDecision: "Je porušení protected fragmentu release blocker, nebo review signal?",
  },
  {
    command: "lab:03",
    file: "evals/03-translation-quality.eval.ts",
    label: "Lab 03",
    runtime: "live generation + judge",
    anchorCase: "translation-basic-cancel-es, translation-edge-tags-fr, translation-edge-drawer-es",
    open: [
      ".evalite/results/lab-03.json",
      "data/evals/translations-basic.jsonl",
      "data/evals/translations-edge-cases.jsonl",
    ],
    read: ["guardrails", "judge", "next", "expected.minQualityScore"],
    edit: "Zpřesněte jednu expectation note nebo threshold u borderline case.",
    expectedSignal: "Výsledek má jasně oddělit hard fail, quality fail a policy review.",
    reset: "Vraťte threshold/note, pokud šlo jen o demonstraci.",
    qaDecision: "Patří suite do release gate, review dashboardu, nebo kalibrace?",
  },
  {
    command: "lab:04",
    file: "evals/04-mobile-search-intent.eval.ts",
    label: "Lab 04",
    runtime: "live generation + deterministic scorers",
    anchorCase: "mobile-intent-open-third-no-context",
    open: [
      ".evalite/results/lab-04.json",
      "data/evals/mobile-search-intents.jsonl",
    ],
    read: ["intent expected->actual", "slots", "missingSlots", "confidence"],
    edit: "Přidejte nebo zpřesněte jeden disallowed/missing slot u ambiguous case.",
    expectedSignal: "next ukáže intent, invented, missing, slots, confidence, nebo pass.",
    reset: "Vraťte dataset edit, pokud šlo jen o kontrolovaný experiment.",
    qaDecision: "Může aplikace pokračovat akcí, nebo se musí doptat?",
  },
  {
    command: "lab:05",
    file: "evals/05-mobile-search-conversation.eval.ts",
    label: "Lab 05",
    runtime: "live generation + judge",
    anchorCase: "mobile-convo-nonstop-ambiguous",
    open: [
      ".evalite/results/lab-05.json",
      "data/evals/mobile-search-conversation.jsonl",
    ],
    read: ["conversation history", "current utterance", "carried slots", "missingSlots"],
    edit: "U ambiguous historie změňte viditelné výsledky tak, aby reference byla jednoznačná.",
    expectedSignal: "Změní se action-vs-clarification signál a carried/missing slot behavior.",
    reset: "Vraťte historii na původní ambiguous variantu.",
    qaDecision: "Je bezpečné spustit UI akci, nebo musí proběhnout clarification?",
  },
  {
    command: "lab:06",
    file: "evals/06-prompt-model-variants.eval.ts",
    label: "Lab 06",
    runtime: "live generation + judge",
    anchorCase: "translation-edge-tags-fr across plain/guard variants",
    open: [
      ".evalite/results/lab-06.json",
      "evals/06-prompt-model-variants.eval.ts",
      "data/evals/translations-edge-cases.jsonl",
    ],
    read: ["same case across variants", "guard", "judge", "next"],
    edit: "Přidejte do records.filter(...) jeden další edge case.",
    expectedSignal: "QA závěr o variantě se má opírat o case-level blocker, ne o průměr.",
    reset: "Vraťte výběr cases na původní sadu.",
    qaDecision: "Která prompt varianta je bezpečnější pro další testovací kolo?",
  },
  {
    command: "lab:07",
    file: "evals/07-travel-info-summary.eval.ts",
    label: "Lab 07",
    runtime: "live generation + judge",
    anchorCase: "travel-summary-luggage-limit",
    open: [
      ".evalite/results/lab-07.json",
      "data/evals/travel-info-summary.jsonl",
    ],
    read: ["requiredFacts", "forbiddenClaims", "includeWarning", "insufficientSource"],
    edit: "Přidejte jeden forbidden claim, který by v provozu byl nebezpečný.",
    expectedSignal: "source_grounded_summary má vysvětlit unsupported nebo chybějící fakt.",
    reset: "Odeberte demonstrační forbidden claim, pokud nemá zůstat jako regression case.",
    qaDecision: "Je summary release gate, review signal, nebo blocker?",
  },
  {
    command: "lab:08",
    file: "evals/08-judge-calibration.eval.ts",
    label: "Lab 08",
    runtime: "judge calibration",
    anchorCase: "judge-borderline-summary",
    open: [
      ".evalite/results/lab-08.json",
      "evals/08-judge-calibration.eval.ts",
    ],
    read: ["targetBand", "minScore", "maxScore", "dimensionScores", "weakest"],
    edit: "Zpřesněte jednu hranici borderline pásma s QA důvodem.",
    expectedSignal: "Known good/bad zůstanou ve správném pásmu a borderline zůstane review.",
    reset: "Vraťte hranici, pokud šlo jen o kalibrační demonstraci.",
    qaDecision: "Je judge gate-ready, nebo zatím jen review signal?",
  },
  {
    command: "lab:09",
    file: "evals/09-prompt-injection.eval.ts",
    label: "Lab 09",
    runtime: "live generation + judge in live mode; local handler in mock mode",
    anchorCase: "pi-hidden",
    open: [
      ".evalite/results/lab-09.json",
      "data/evals/prompt-injection.jsonl",
    ],
    read: ["trustedInstruction", "userRequest", "suppliedText", "blockedInstructions"],
    edit: "Doplňte jeden prohibitedResponseTrait nebo requiredResponseTrait.",
    expectedSignal: "Safety scorer má chránit přesně injected instrukci, ne zahodit celý úkol.",
    reset: "Vraťte expectation edit, pokud byl jen demonstrační.",
    qaDecision: "Jde o release blocker, nebo review signal?",
  },
  {
    command: "lab:10",
    file: "evals/10-consistency-regression.eval.ts",
    label: "Lab 10",
    runtime: "local deterministic recorded regression",
    anchorCase: "consistency-policy-window",
    open: [
      ".evalite/results/lab-10.json",
      "data/evals/consistency.jsonl",
    ],
    read: ["invariantAnswer", "mustMatchFields", "allowedDifferences", "regressionCases"],
    edit: "Zpřesněte mustMatchFields nebo allowedDifferences pro jeden invariant.",
    expectedSignal: "Gate má odlišit změnu významu od povolené formulace.",
    reset: "Vraťte invariant edit, pokud byl jen demonstrační.",
    qaDecision: "Je variabilita přijatelná, nebo regression blocker?",
  },
  {
    command: "lab:11",
    file: "evals/11-agentic-eval-authoring.eval.ts",
    label: "Lab 11",
    runtime: "live generation + judge",
    anchorCase: "agent-summary-transfer",
    open: [
      ".evalite/results/lab-11.json",
      "data/evals/agent-authored-summary.jsonl",
      "evals/11-agentic-eval-authoring.eval.ts",
    ],
    read: ["source", "judge", "review", "next", "agent diff"],
    edit: "Zadejte agentovi přesně jeden nový synthetic missing-source case a jednu review kontrolu.",
    expectedSignal: "Nový case projde data:check a lab:11 dává obhajitelné QA rozhodnutí.",
    reset: "Agentův diff ponechte jen pokud QA review potvrdí risk a metadata.",
    qaDecision: "Je agentem přidaný case release blocker, review signal, nebo weak case?",
  },
] as const satisfies readonly LabDefinition[];

const rawArgs = process.argv.slice(2);
const requestedCommand = rawArgs[0];

const parseWorkshopMode = (
  value: string | undefined,
): WorkshopMode | undefined => {
  if (value === "live" || value === "mock") {
    return value;
  }

  if (value !== undefined) {
    throw new Error(`Invalid workshop mode: ${value}. Expected live or mock.`);
  }

  return undefined;
};

const parsedArgs = (() => {
  const passthrough: string[] = [];
  let workshopMode: WorkshopMode | undefined;

  for (let index = 1; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === undefined) {
      continue;
    }

    if (arg === "--") {
      continue;
    }

    if (arg === "--mock") {
      workshopMode = "mock";
      continue;
    }

    if (arg === "--live") {
      workshopMode = "live";
      continue;
    }

    if (arg === "--workshop-mode") {
      const value = rawArgs[index + 1];
      workshopMode = parseWorkshopMode(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--workshop-mode=")) {
      workshopMode = parseWorkshopMode(arg.slice("--workshop-mode=".length));
      continue;
    }

    passthrough.push(arg);
  }

  return { passthroughArgs: passthrough, workshopMode };
})();

const passthroughArgs = parsedArgs.passthroughArgs;

const displayPath = (path: string): string => relative(rootDir, path) || ".";

const pathExists = async (relativePath: string): Promise<boolean> => {
  try {
    await access(resolve(rootDir, relativePath));
    return true;
  } catch {
    return false;
  }
};

const failForMissing = (paths: readonly string[]): never => {
  console.error("Integration dependency missing:");
  for (const path of paths) {
    console.error(`- ${path}`);
  }
  console.error("The runtime command is wired, but the owning lane must add these files.");
  process.exit(1);
};

const assertPathsExist = async (paths: readonly string[]): Promise<void> => {
  const missing: string[] = [];

  for (const path of paths) {
    if (!(await pathExists(path))) {
      missing.push(path);
    }
  }

  if (missing.length > 0) {
    failForMissing(missing);
  }
};

const run = async (
  executable: string,
  args: readonly string[],
  envOverrides: NodeJS.ProcessEnv = {},
): Promise<number> => {
  const child = spawn(executable, [...args], {
    cwd: rootDir,
    env: { ...process.env, ...envOverrides },
    stdio: "inherit",
  });

  return await new Promise<number>((resolveProcess, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      resolveProcess(code ?? 1);
    });
  });
};

const runEvaliteBinary = async (
  args: readonly string[],
  envOverrides: NodeJS.ProcessEnv = {},
): Promise<number> => run(process.execPath, [evaliteBin, ...args], envOverrides);

const resultPathFor = (name: string): string =>
  resolve(rootDir, ".evalite", "results", `${name}.json`);

const threshold = (): string => process.env["EVALITE_SCORE_THRESHOLD"] ?? "70";

const isUnknownRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readStringField = (
  value: Record<string, unknown>,
  key: string,
): string | undefined => {
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : undefined;
};

const readStringArrayField = (
  value: Record<string, unknown>,
  key: string,
): string[] => {
  const candidate = value[key];
  return Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === "string")
    : [];
};

const resultSuiteFor = async (
  resultPath: string,
): Promise<Record<string, unknown> | undefined> => {
  const parsed = JSON.parse(await readFile(resultPath, "utf8")) as unknown;

  if (!isUnknownRecord(parsed) || !Array.isArray(parsed["suites"])) {
    return undefined;
  }

  return parsed["suites"].find(isUnknownRecord);
};

const assertResultMatchesLab = async (
  resultPath: string,
  lab: LabDefinition,
): Promise<void> => {
  const suite = await resultSuiteFor(resultPath);
  const filepath = suite === undefined ? undefined : readStringField(suite, "filepath");

  if (filepath === undefined) {
    throw new Error(`Evalite result ${displayPath(resultPath)} does not contain a suite filepath.`);
  }

  const expected = resolve(rootDir, lab.file);
  const actual = resolve(filepath);

  if (actual !== expected) {
    throw new Error(
      [
        `Evalite result mismatch for ${lab.label}.`,
        `Expected: ${displayPath(expected)}`,
        `Actual:   ${displayPath(actual)}`,
        "Re-run with an isolated EVALITE_DB_PATH or clear stale Evalite state.",
      ].join("\n"),
    );
  }
};

const printLabContract = (lab: LabDefinition): void => {
  console.log("");
  console.log(`Lab contract: ${lab.label}`);
  console.log(`- Runtime: ${lab.runtime}`);
  console.log(`- Anchor case: ${lab.anchorCase}`);
  console.log(`- Open: ${lab.open.join(", ")}`);
  console.log(`- Read: ${lab.read.join(", ")}`);
  console.log(`- Edit: ${lab.edit}`);
  console.log(`- Expected signal: ${lab.expectedSignal}`);
  console.log(`- Reset: ${lab.reset}`);
  console.log(`- QA decision: ${lab.qaDecision}`);
};

const printLab01ReadingGuide = async (resultPath: string): Promise<void> => {
  const parsed = JSON.parse(await readFile(resultPath, "utf8")) as unknown;

  if (!isUnknownRecord(parsed) || !Array.isArray(parsed["suites"])) {
    return;
  }

  const suite = parsed["suites"].find(isUnknownRecord);
  if (suite === undefined || !Array.isArray(suite["evals"])) {
    return;
  }

  console.log("");
  console.log("Jak číst Lab 01:");
  console.log("- Dataset rows jsou schválně rozbité workshopové fixtures.");
  console.log("- 100% score znamená, že audit našel plánované vady.");
  console.log("- Neznamená to, že dataset row je čistý nebo připravený do release gate.");
  console.log("");
  console.log("Jak určit, co fixnout:");
  console.log("- Nehádejte z čísla Score.");
  console.log("- Vezměte konkrétní case ID, otevřete stejný řádek v data/evals/dataset-quality-broken.jsonl.");
  console.log("- V `fixPlan` čtěte každý řádek jako: rozbitý field -> minimální oprava.");
  console.log("- Lektorský anchor: `translation-cancel-booking-incomplete` je production-candidate style case.");
  console.log("  Má reálný QA risk: překlad destruktivní akce nesmí změkčit nebo otočit význam.");
  console.log("");
  console.log("Souhrn cases:");

  for (const item of suite["evals"]) {
    if (!isUnknownRecord(item)) {
      continue;
    }

    const input = readStringField(item, "input") ?? "unknown";
    const outputText = readStringField(item, "output") ?? "{}";
    const caseId = input.split(" | ")[0] ?? input;
    const output = JSON.parse(outputText) as unknown;

    if (!isUnknownRecord(output)) {
      continue;
    }

    const rowStatus = readStringField(output, "rowStatus") ?? "unknown";
    const fixPlan = readStringArrayField(output, "fixPlan");

    console.log(`- ${caseId}: rowStatus=${rowStatus}`);
    for (const fix of fixPlan) {
      console.log(`  - ${fix}`);
    }
  }

  console.log("");
  console.log("Úkol pro účastníky:");
  console.log("Ke každému case řekněte: 1. co je rozbité, 2. proč je to QA riziko, 3. jaký je minimální fix.");
};

const printLab02ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 02:");
  console.log("- Tabulka je triage dashboard. Ukáže podezřelý case, ne celý důvod.");
  console.log("- Pořadí řádků neberte jako součást úkolu. Vždy se orientujte podle `case`.");
  console.log("- `guard` je hard guardrail score: placeholders, tagy, kódy a glossary.");
  console.log("- `forbid` je kontrola zakázaných tvarů a rozbitých protected fragmentů.");
  console.log("- `next` říká první QA problém: hard fail, forbidden, review, nebo pass.");
  console.log("- `.evalite/results/lab-02.json` = výsledek běhu: output, scores, detaily.");
  console.log("- `data/evals/translations-edge-cases.jsonl` = dataset: input a expected.");
  console.log("- `evals/02-translation-guardrails.eval.ts` = scoring logika, pokud ji chcete prohlédnout.");
  console.log("");
  console.log("A. Analýza připraveného failu, bez editace:");
  console.log("1. Otevřete `.evalite/results/lab-02.json`.");
  console.log("2. Najděte `translation-edge-tags-fr`.");
  console.log("3. Čtěte `output.text` a `scores`.");
  console.log("4. Očekávání porovnejte s řádkem v datasetu: `expected.mustPreserve` a `expected.forbiddenPatterns`.");
  console.log("5. `translation-edge-tags-fr` neupravujte. Je to hotový příklad failu.");
  console.log("");
  console.log("B. Kontrolovaný experiment, editace jiného case:");
  console.log("1. Otevřete `data/evals/translations-edge-cases.jsonl`.");
  console.log("2. Najděte `translation-edge-placeholders-es`.");
  console.log("3. Do `input.placeholders` přidejte `{{missing_placeholder}}`.");
  console.log("4. Spusťte znovu `pnpm run lab:02`.");
  console.log("5. V `.evalite/results/lab-02.json` zkontrolujte stejný case a jeho `scores`.");
  console.log("6. Placeholder scorer začne čekat hodnotu, kterou output neobsahuje, a score spadne.");
  console.log("");
  console.log("Pozor:");
  console.log("- `translation-edge-tags-fr` slouží jen ke čtení výsledku.");
  console.log("- `translation-edge-placeholders-es` slouží k ručnímu rozbití očekávání v datasetu.");
  console.log("- U placeholder case scorer čte očekávané placeholdery z `input.placeholders`.");
  console.log("- Změna `expected.mustPreserve` placeholder guardrail nerozbije.");
  console.log("- Pokud se při live běhu změní i jiný case, není to efekt B experimentu.");
  console.log("  Je to samostatný live-model signál, typicky glossary nebo formulace.");
  console.log("- Po experimentu `{{missing_placeholder}}` zase odeberte.");
};

const printLab03ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 03:");
  console.log("- Tohle není hledání jedné chyby. Tohle je porovnání tvrdých pravidel a judge hodnocení.");
  console.log("- `guardrails` říká: zůstaly zachované placeholders, tagy, kódy, forbidden phrases a glossary?");
  console.log("- `judge` říká: dává překlad významově a produktově smysl podle kritérií?");
  console.log("- `next` je lektorská zkratka, kam se má QA dívat dál.");
  console.log("");
  console.log("Jak z tabulky vybrat cases:");
  console.log("- Otevřete `.evalite/results/lab-03.json` a podle `case` najděte detail outputu a `scores`.");
  console.log("- Otevřete dataset řádek v `data/evals/translations-basic.jsonl` nebo `data/evals/translations-edge-cases.jsonl`.");
  console.log("- V datasetu porovnejte `expected.idealText`, `expected.mustPreserve`, `expected.forbiddenPatterns`, `expected.glossary` a `expected.minQualityScore`.");
  console.log("- `hard fail`: nejdřív řešte strukturu. Judge debata je vedlejší, release by se měl zastavit.");
  console.log("- `quality`: struktura může vypadat dobře, ale význam nebo terminologie je špatně.");
  console.log("- `policy`: není jasné čisté pass/fail. Tým musí rozhodnout pravidlo, threshold nebo poznámku.");
  console.log("- `pass`: použijte jako kontrolní příklad, jak vypadá zdravý output.");
  console.log("");
  console.log("Doporučené anchors pro výklad:");
  console.log("- `translation-basic-cancel-es`: guardrails mohou projít, ale judge chytí otočený význam.");
  console.log("- `translation-edge-tags-fr`: strukturální hard fail; chybí tagy a chráněný kód.");
  console.log("- `translation-edge-drawer-es`: policy review nad glossary termínem.");
  console.log("");
  console.log("Detail důvodu hledejte v `.evalite/results/lab-03.json` u `scores`.");
};

const printLab04ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 04:");
  console.log("- `intent` čtěte jako `expected->actual`: vlevo je očekávání, vpravo výstup modelu.");
  console.log("  Zkratky: `ask` = ask_clarification, `find` = find_item, `open` = open_result.");
  console.log("- `conf` je skutečná confidence / minimální confidence z datasetu.");
  console.log("- `slots` je počet správně vyplněných required slots + stav missingSlots.");
  console.log("- `next` říká první věc, kterou má QA řešit: intent, invented, missing, slots, confidence, policy, nebo pass.");
  console.log("- Missing fields a špatné slots mají prioritu před confidence.");
  console.log("");
  console.log("Jak postupovat:");
  console.log("1. Otevřete `.evalite/results/lab-04.json` a vyberte řádek, kde `next` není `pass`.");
  console.log("2. Stejné case ID najděte v `data/evals/mobile-search-intents.jsonl`.");
  console.log("3. Pokud `intent` nemá stejnou levou a pravou stranu, model by spustil špatnou app action.");
  console.log("4. V datasetu porovnejte `expected.requiredSlots`, `expected.missingSlots`, `expected.disallowedSlots` a `expected.minIntentConfidence`.");
  console.log("5. Pokud `slots` končí `diff`, porovnejte `expected.missingSlots` s `output.missingSlots`.");
  console.log("6. Pokud `next` je `invented`, model vrátil zakázaný slot.");
};

const printLab05ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 05:");
  console.log("- `intent` čtěte jako `expected->actual`: vlevo je očekávání, vpravo výstup modelu.");
  console.log("- `slots` je carried/current required slots + stav missingSlots.");
  console.log("- `state` je skóre conversation_state: intent + carried slots + missing behavior.");
  console.log("- `next` říká první QA problém: intent, missing, slots, confidence, state, policy, nebo pass.");
  console.log("- Missing fields a špatné slots mají prioritu před confidence.");
  console.log("");
  console.log("Úkol Lab 05:");
  console.log("1. Vyberte jeden `pass` case a jeden case, kde `next` není `pass`.");
  console.log("2. U každého napište krátkou trace: co přišlo z historie a co z aktuální věty.");
  console.log("3. Označte slots převzaté z historie, nové slots z utterance a chybějící slots.");
  console.log("4. Rozhodněte, jestli aplikace může pokračovat akcí, nebo se musí doptat.");
  console.log("5. U ambiguous case zkuste upravit historii tak, aby reference byla jednoznačná, a spusťte lab znovu.");
  console.log("");
  console.log("Jak postupovat:");
  console.log("1. Vyberte řádek, kde `next` není `pass`.");
  console.log("2. Otevřete dataset case v `data/evals/mobile-search-conversation.jsonl`.");
  console.log("3. Oddělte slots z historie od slots z aktuální věty.");
  console.log("4. Detail výstupu a scorers najdete v `.evalite/results/lab-05.json`.");
};

const printLab06ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 06:");
  console.log("- Každý case běží přes prompt variantu `plain` nebo `guard`.");
  console.log("- `risk` ukazuje riziko konkrétního case; v tomto labu pracujeme s low/medium edge cases.");
  console.log("- `guard` je skóre hard guardrails: placeholders, tags, codes, glossary.");
  console.log("- `judge` je kvalita významu podle translation kritérií.");
  console.log("- `next` říká první QA krok: block, quality, compare, nebo pass.");
  console.log("");
  console.log("Jak postupovat:");
  console.log("1. Porovnejte stejný case napříč variantami.");
  console.log("2. Otevřete `.evalite/results/lab-06.json` a u stejného case porovnejte output variant `plain` a `guard`.");
  console.log("3. Otevřete `evals/06-prompt-model-variants.eval.ts` a najděte `variants` a `records.filter(...)`.");
  console.log("4. Dataset expectations jsou v `data/evals/translations-edge-cases.jsonl`.");
  console.log("5. Nevybírejte vítěze podle průměru, pokud protected-fragment case failuje.");
};

const printLab07ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 07:");
  console.log("- `focus` říká hlavní QA riziko: facts, warning, nebo limits.");
  console.log("- `source` je source-grounded summary score: required facts, unsupported claims, warning, length.");
  console.log("- `judge` je kvalita shrnutí podle summary kritérií.");
  console.log("- `next` říká první problém: source, quality, policy, nebo pass.");
  console.log("");
  console.log("Jak postupovat:");
  console.log("1. Otevřete `.evalite/results/lab-07.json` a vyberte case se `source`, `quality` nebo `policy`.");
  console.log("2. Stejné case ID najděte v `data/evals/travel-info-summary.jsonl`.");
  console.log("3. U `source` problému čtěte `expected.requiredFacts` a `expected.forbiddenClaims`.");
  console.log("4. U `limits` ověřte `expected.insufficientSource`, `expected.includeWarning` a `expected.maxSentences`.");
  console.log("5. Porovnejte je s `output.summary` a detailními `scores`.");
};

const printLab08ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 08:");
  console.log("- Tohle testuje judge, ne aplikaci.");
  console.log("- `band` je očekávané pásmo: good, borderline, nebo bad.");
  console.log("- `score` je reálné judge score.");
  console.log("- `weakest` ukazuje nejslabší judge dimenzi a její separátní skóre, například `facts=0.72`.");
  console.log("- `ok` znamená, že všechny judge dimenze vyšly na 1.00.");
  console.log("- Zkratky: facts=fakta, ground=zdroj, task=splnění úkolu, instr=injected instrukce, leak=únik/interní instrukce.");
  console.log("- `next` říká band ok, review, nebo recalibrate.");
  console.log("- `band ok` znamená, že judge trefil očekávané pásmo; ne že je hodnocený output dobrý.");
  console.log("");
  console.log("Jak postupovat:");
  console.log("1. Otevřete `evals/08-judge-calibration.eval.ts` a najděte `calibrationData`.");
  console.log("2. Pro každý case porovnejte `output`, `expectedBehavior`, `expected.targetBand`, `minScore` a `maxScore`.");
  console.log("3. Detail dimenzí najdete v `.evalite/results/lab-08.json` u `dimensionScores`.");
  console.log("4. Known bad nesmí spadnout do pohodlného pass rozhodnutí.");
  console.log("5. Borderline má zůstat reviewovatelný.");
};

const printLab09ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 09:");
  console.log("- `safety` je hard safety scoring: injected instrukce, leakage, secret-like output.");
  console.log("- `judge` hodnotí, jestli model splnil bezpečný úkol a ignoroval supplied text instrukce.");
  console.log("- `next` říká první problém: safety, judge, policy, nebo pass.");
  console.log("- I když high-risk case vyjde `pass`, otevřete detail a ověřte, že output neuposlechl supplied text instrukci.");
  console.log("");
  console.log("Jak postupovat:");
  console.log("1. Otevřete `.evalite/results/lab-09.json` a vyberte case, kde `next` není `pass`.");
  console.log("2. Stejné case ID najděte v `data/evals/prompt-injection.jsonl`.");
  console.log("3. V datasetu oddělte `input.trustedInstruction`, `input.userRequest` a `input.suppliedText`.");
  console.log("4. V `input.suppliedText` najděte injected instrukci; očekávané bloky jsou v `expected.blockedInstructions`.");
  console.log("5. Porovnejte `expected.requiredResponseTraits`, `expected.prohibitedResponseTraits` a `expected.allowedContent` s outputem.");
  console.log("6. Pokud `safety` spadne, řešíte release blocker.");
};

const printLab10ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 10:");
  console.log("- `cons` je stabilita odpovědí napříč parafrázemi.");
  console.log("- `base` je currentScore / baselineScore.");
  console.log("- `reg` je regression gate proti uloženému baseline.");
  console.log("- `next` říká první problém: regression, drift, policy, nebo pass.");
  console.log("");
  console.log("Jak postupovat:");
  console.log("1. Otevřete `.evalite/results/lab-10.json` a vyberte case s `regression`, `drift` nebo `policy`.");
  console.log("2. Stejné case ID najděte v `data/evals/consistency.jsonl`.");
  console.log("3. V datasetu čtěte `input.variants`, `expected.invariantAnswer`, `expected.mustMatchFields` a `expected.allowedDifferences`.");
  console.log("4. U `regression` otevřete `regressionCases` v detailu výsledku.");
  console.log("5. Hledejte změnu business invariant, ne rozdíl ve formulaci.");
};

const printLab11ReadingGuide = (): void => {
  console.log("");
  console.log("Jak číst Lab 11:");
  console.log("- `source` a `judge` ověřují kvalitu agentem připraveného summary case.");
  console.log("- `review` ověřuje metadata: agent-authored label, review hint, edit targets a notes.");
  console.log("- `next` říká první problém: metadata, source, quality, review, nebo pass.");
  console.log("- Pokud `source` spadne a `judge` projde, věřte nejdřív source scoreru: judge může přehlédnout missing-source risk.");
  console.log("");
  console.log("Konkrétní zadání pro agenta:");
  console.log("Přidej jeden syntetický Lab 11 eval case pro travel summary, kde source text neobsahuje odpověď na část otázky.");
  console.log("Edituj jen `data/evals/agent-authored-summary.jsonl` a případně `evals/11-agentic-eval-authoring.eval.ts`.");
  console.log("Case musí mít `agent-authored` label, jasné `expectedBehavior`, konkrétní `requiredFacts`, konkrétní `forbiddenClaims`, `risk` podle dopadu a review metadata.");
  console.log("Přidej nejvýše jednu malou review kontrolu, která ověří, že nový case má užitečná metadata nebo forbidden claim.");
  console.log("Nepoužívej reálná zákaznická, booking, airport ani route data.");
  console.log("Po změně spusť `pnpm run data:check` a `pnpm run lab:11` a napiš changed files + QA rozhodnutí.");
  console.log("");
  console.log("Jak postupovat:");
  console.log("1. Nejdřív zkuste vlastní assignment pro coding agenta podle zadání výše.");
  console.log("2. Agent smí editovat hlavně `data/evals/agent-authored-summary.jsonl` a `evals/11-agentic-eval-authoring.eval.ts`.");
  console.log("3. Fallback prompt otevřete v `docs/agent-prompts/lab-11-agentic-eval-authoring.md` až když se zaseknete.");
  console.log("4. Po změně otevřete `.evalite/results/lab-11.json` a zkontrolujte `source`, `judge`, `review` a `next`.");
  console.log("5. Agentův diff reviewujte jako QA evidence, ne jako hotovou pravdu.");
};

const printReadingGuideFor = async (
  command: LabDefinition["command"],
  resultPath: string,
): Promise<void> => {
  switch (command) {
    case "lab:01":
      await printLab01ReadingGuide(resultPath);
      break;
    case "lab:02":
      printLab02ReadingGuide();
      break;
    case "lab:03":
      printLab03ReadingGuide();
      break;
    case "lab:04":
      printLab04ReadingGuide();
      break;
    case "lab:05":
      printLab05ReadingGuide();
      break;
    case "lab:06":
      printLab06ReadingGuide();
      break;
    case "lab:07":
      printLab07ReadingGuide();
      break;
    case "lab:08":
      printLab08ReadingGuide();
      break;
    case "lab:09":
      printLab09ReadingGuide();
      break;
    case "lab:10":
      printLab10ReadingGuide();
      break;
    case "lab:11":
      printLab11ReadingGuide();
      break;
  }
};

const labPortFor = (lab: LabDefinition): string => {
  const labIndex = labs.findIndex((candidate) => candidate.command === lab.command);
  return process.env["EVALITE_LAB_PORT"] ?? String(3100 + Math.max(labIndex, 0) * 10);
};

const envForLab = (lab: LabDefinition): NodeJS.ProcessEnv => ({
  EVALITE_PORT: labPortFor(lab),
  ...(parsedArgs.workshopMode === undefined
    ? {}
    : {
        WORKSHOP_MODE: parsedArgs.workshopMode,
        LIVE_LLM_ENABLED: parsedArgs.workshopMode === "live" ? "true" : "false",
        TP_EVALS_LIVE_JUDGE: parsedArgs.workshopMode === "live" ? "true" : "false",
      }),
});

const runEvalite = async (
  args: readonly string[],
  resultPath?: string,
  envOverrides: NodeJS.ProcessEnv = {},
): Promise<never> => {
  const outputArgs =
    resultPath === undefined
      ? []
      : ["--outputPath", resultPath] satisfies readonly string[];

  if (resultPath !== undefined) {
    await mkdir(dirname(resultPath), { recursive: true });
  }

  const exitCode = await runEvaliteBinary([
    ...args,
    ...outputArgs,
    ...passthroughArgs,
  ], envOverrides);
  process.exit(exitCode);
};

const collectJsonlFiles = async (directory: string): Promise<string[]> => {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonlFiles(fullPath)));
    } else if (entry.isFile() && extname(entry.name) === ".jsonl") {
      files.push(fullPath);
    }
  }

  return files.sort();
};

const readJsonlStats = async (): Promise<{
  readonly files: Array<{ readonly path: string; readonly records: number }>;
  readonly issues: string[];
}> => {
  const dataDir = resolve(rootDir, "data");
  const files = await collectJsonlFiles(dataDir);

  if (files.length === 0) {
    failForMissing(["data/**/*.jsonl"]);
  }

  const issues: string[] = [];
  const stats: Array<{ path: string; records: number }> = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lines = content.split(/\r?\n/u);
    let records = 0;

    for (const [index, line] of lines.entries()) {
      const lineNumber = index + 1;

      if (line.length === 0 && lineNumber === lines.length) {
        continue;
      }

      if (line.trim() === "") {
        issues.push(`${displayPath(file)}:${lineNumber} is blank.`);
        continue;
      }

      try {
        objectRecordSchema.parse(JSON.parse(line) as unknown);
        records += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        issues.push(`${displayPath(file)}:${lineNumber} ${message}`);
      }
    }

    stats.push({ path: displayPath(file), records });
  }

  return { files: stats, issues };
};

const runDataCheck = async (): Promise<never> => {
  if (await pathExists("scripts/validate-datasets.ts")) {
    const exitCode = await run("tsx", [
      "scripts/validate-datasets.ts",
      ...passthroughArgs,
    ]);
    process.exit(exitCode);
  }

  const { files, issues } = await readJsonlStats();

  for (const file of files) {
    console.log(`${file.path}: ${file.records} records`);
  }

  if (issues.length > 0) {
    console.error("Dataset validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log("Dataset validation passed.");
  process.exit(0);
};

const runDataSummary = async (): Promise<never> => {
  if (await pathExists("scripts/print-dataset-summary.ts")) {
    const exitCode = await run("tsx", [
      "scripts/print-dataset-summary.ts",
      ...passthroughArgs,
    ]);
    process.exit(exitCode);
  }

  const { files, issues } = await readJsonlStats();
  const totalRecords = files.reduce((total, file) => total + file.records, 0);

  console.log(`Dataset files: ${files.length}`);
  console.log(`Dataset records: ${totalRecords}`);
  for (const file of files) {
    console.log(`- ${file.path}: ${file.records}`);
  }

  if (issues.length > 0) {
    console.log(`Validation issues: ${issues.length}`);
  }

  process.exit(0);
};

const runLab = async (lab: LabDefinition): Promise<never> => {
  await assertPathsExist([lab.file]);
  console.log(`Running ${lab.label}: ${lab.file}`);
  printLabContract(lab);
  const resultPath = resultPathFor(lab.command.replace(":", "-"));
  await mkdir(dirname(resultPath), { recursive: true });

  const exitCode = await runEvaliteBinary([
    "run",
    lab.file,
    "--threshold",
    threshold(),
    "--outputPath",
    resultPath,
    ...passthroughArgs,
  ], envForLab(lab));

  await assertResultMatchesLab(resultPath, lab);

  if (exitCode === 0) {
    await printReadingGuideFor(lab.command, resultPath);
  }

  process.exit(exitCode);
};

const runLabAll = async (): Promise<never> => {
  await assertPathsExist(labs.map((lab) => lab.file));

  for (const lab of labs) {
    console.log(`Running ${lab.label}: ${lab.file}`);
    printLabContract(lab);
    const resultPath = resultPathFor(lab.command.replace(":", "-"));
    const exitCode = await runEvaliteBinary([
      "run",
      lab.file,
      "--threshold",
      threshold(),
      "--outputPath",
      resultPath,
      ...passthroughArgs,
    ], envForLab(lab));

    await assertResultMatchesLab(resultPath, lab);

    if (exitCode !== 0) {
      process.exit(exitCode);
    }

    await printReadingGuideFor(
      lab.command,
      resultPathFor(lab.command.replace(":", "-")),
    );
  }

  process.exit(0);
};

const runEvalDev = async (): Promise<never> => {
  await assertPathsExist(["evals"]);
  return runEvalite(["watch", "evals"]);
};

const runEvalAll = async (): Promise<never> => {
  await assertPathsExist(labs.map((lab) => lab.file));
  return runEvalite(
    ["run", "evals", "--threshold", threshold()],
    resolve(rootDir, process.env["EVALITE_RESULT_PATH"] ?? ".evalite/results/latest.json"),
  );
};

const runEvalExport = async (): Promise<never> => {
  const dbPath = process.env["EVALITE_DB_PATH"] ?? ".evalite/evalite.db";
  const dbStat = await stat(resolve(rootDir, dbPath)).catch(() => undefined);

  if (dbStat === undefined || !dbStat.isFile()) {
    failForMissing([dbPath]);
  }

  return runEvalite(["export", "--output", "evalite-export"]);
};

const printUsage = (): never => {
  console.error("Usage: tsx scripts/run-lab.ts <command>");
  console.error("Commands:");
  console.error("- data:check");
  console.error("- data:summary");
  for (const lab of labs) {
    console.error(`- ${lab.command}`);
  }
  console.error("- lab:all");
  console.error("- eval:dev");
  console.error("- eval:all");
  console.error("- eval:export");
  process.exit(1);
};

const findLab = (value: string): LabDefinition | undefined => {
  return labs.find((lab) => lab.command === value);
};

const command = requestedCommand ?? printUsage();

if (command === "data:check") {
  await runDataCheck();
} else if (command === "data:summary") {
  await runDataSummary();
} else if (command === "lab:all") {
  await runLabAll();
} else if (command === "eval:dev") {
  await runEvalDev();
} else if (command === "eval:all") {
  await runEvalAll();
} else if (command === "eval:export") {
  await runEvalExport();
} else {
  const lab = findLab(command) ?? printUsage();
  await runLab(lab);
}

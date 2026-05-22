import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const presentationSlidesPath = resolve(
  rootDir,
  "..",
  "..",
  "..",
  "side",
  "experiments",
  "presentations",
  "apps",
  "tp-evals",
  "src",
  "content",
  "slides.ts",
);
const presentationContentSlidePath = resolve(
  rootDir,
  "..",
  "..",
  "..",
  "side",
  "experiments",
  "presentations",
  "apps",
  "tp-evals",
  "src",
  "slides",
  "ContentSlide.astro",
);

type LabDocCheck = {
  readonly id: string;
  readonly title: string;
  readonly file: string;
  readonly command: string;
  readonly contractAnchor: string;
  readonly requiredTerms: readonly string[];
};

const labs = [
  {
    id: "01",
    title: "Dataset Quality Audit",
    file: "docs/labs/lab-01-dataset-quality.md",
    command: "pnpm run lab:01",
    contractAnchor: "lab-01---dataset-quality-audit",
    requiredTerms: ["rowStatus", "fixPlan", "QA rozhodnutí"],
  },
  {
    id: "02",
    title: "Translation Guardrails",
    file: "docs/labs/lab-02-translation-guardrails.md",
    command: "pnpm run lab:02",
    contractAnchor: "lab-02---translation-guardrails",
    requiredTerms: [
      "translation-edge-tags-fr",
      "translation-edge-placeholders-es",
      "{{missing_placeholder}}",
      "input.placeholders",
    ],
  },
  {
    id: "03",
    title: "Translation Quality Judge",
    file: "docs/labs/lab-03-translation-quality.md",
    command: "pnpm run lab:03",
    contractAnchor: "lab-03---translation-quality-judge",
    requiredTerms: ["guardrails", "judge", "next", "translation-basic-cancel-es"],
  },
  {
    id: "04",
    title: "Mobile Search Intent",
    file: "docs/labs/lab-04-mobile-search-intent.md",
    command: "pnpm run lab:04",
    contractAnchor: "lab-04---mobile-search-intent",
    requiredTerms: ["intent", "expected->actual", "slots", "missingSlots"],
  },
  {
    id: "05",
    title: "Mobile Search Conversation",
    file: "docs/labs/lab-05-mobile-search-conversation.md",
    command: "pnpm run lab:05",
    contractAnchor: "lab-05---mobile-search-conversation",
    requiredTerms: ["mobile-convo-nonstop-ambiguous", "carried", "missingSlots", "clarification"],
  },
  {
    id: "06",
    title: "Live Prompt Variants",
    file: "docs/labs/lab-06-prompt-model-variants.md",
    command: "pnpm run lab:06",
    contractAnchor: "lab-06---live-prompt-variants",
    requiredTerms: ["plain", "guard", "records.filter", "case-level"],
  },
  {
    id: "07",
    title: "Travel Info Summary",
    file: "docs/labs/lab-07-travel-info-summary.md",
    command: "pnpm run lab:07",
    contractAnchor: "lab-07---travel-info-summary",
    requiredTerms: ["requiredFacts", "forbiddenClaims", "source", "unsupported"],
  },
  {
    id: "08",
    title: "Judge Calibration",
    file: "docs/labs/lab-08-judge-calibration.md",
    command: "pnpm run lab:08",
    contractAnchor: "lab-08---judge-calibration",
    requiredTerms: ["targetBand", "dimensionScores", "weakest", "band ok"],
  },
  {
    id: "09",
    title: "Prompt Injection",
    file: "docs/labs/lab-09-prompt-injection.md",
    command: "pnpm run lab:09",
    contractAnchor: "lab-09---prompt-injection",
    requiredTerms: ["trustedInstruction", "userRequest", "suppliedText", "blockedInstructions"],
  },
  {
    id: "10",
    title: "Consistency Regression",
    file: "docs/labs/lab-10-consistency-regression.md",
    command: "pnpm run lab:10",
    contractAnchor: "lab-10---consistency-regression",
    requiredTerms: ["invariantAnswer", "mustMatchFields", "allowedDifferences", "regressionCases"],
  },
  {
    id: "11",
    title: "Agentic Eval Authoring",
    file: "docs/labs/lab-11-agentic-eval-authoring.md",
    command: "pnpm run lab:11",
    contractAnchor: "lab-11---agentic-eval-authoring",
    requiredTerms: ["agent-authored", "data:check", "QA rozhodnutí", "missing source information"],
  },
] as const satisfies readonly LabDocCheck[];

const requiredLabSections = [
  "## Kontext",
  "## Cíl",
  "## Runtime a kontrakt",
  "## Soubory",
  "## Úkol",
  "## Gate / ověření",
  "## QA rozhodnutí",
] as const;

const readProjectFile = (path: string): Promise<string> =>
  readFile(resolve(rootDir, path), "utf8");

const assertIncludes = (
  content: string,
  needle: string,
  context: string,
  errors: string[],
): void => {
  if (!content.includes(needle)) {
    errors.push(`${context}: missing "${needle}"`);
  }
};

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const errors: string[] = [];

const labContracts = await readProjectFile("docs/facilitator/lab-contracts.md");
const goldenPath = await readProjectFile("docs/facilitator/golden-path.md");
const runner = await readProjectFile("scripts/run-lab.ts");
const labsReadme = await readProjectFile("docs/labs/README.md");

for (const lab of labs) {
  const content = await readProjectFile(lab.file);
  const context = `Lab ${lab.id} docs`;

  assertIncludes(content, `# Lab ${lab.id}: ${lab.title}`, context, errors);
  assertIncludes(content, lab.command, context, errors);
  assertIncludes(content, `#${lab.contractAnchor}`, context, errors);

  for (const section of requiredLabSections) {
    assertIncludes(content, section, context, errors);
  }

  for (const term of lab.requiredTerms) {
    assertIncludes(content, term, context, errors);
  }

  assertIncludes(labContracts, `## Lab ${lab.id}`, "lab contracts", errors);
  assertIncludes(goldenPath, `## Lab ${lab.id}`, "golden path", errors);
  assertIncludes(runner, `printLab${lab.id}ReadingGuide`, "run-lab reading guides", errors);
  assertIncludes(labsReadme, `[Lab ${lab.id}]`, "docs/labs/README.md", errors);
}

assertIncludes(labContracts, "Runtime:", "lab contracts", errors);
assertIncludes(labContracts, "Expected signal:", "lab contracts", errors);
assertIncludes(labContracts, "QA decision:", "lab contracts", errors);
assertIncludes(goldenPath, "Observe -> Explain -> Modify -> Re-run -> Decide", "golden path", errors);

if (await fileExists(presentationSlidesPath)) {
  const slides = [
    await readFile(presentationSlidesPath, "utf8"),
    (await fileExists(presentationContentSlidePath))
      ? await readFile(presentationContentSlidePath, "utf8")
      : "",
  ].join("\n");

  for (const lab of labs) {
    assertIncludes(slides, `${lab.id} `, "presentation slides", errors);
    assertIncludes(slides, lab.command, "presentation slides", errors);
  }

  assertIncludes(slides, "AI proxy", "presentation slides", errors);
  assertIncludes(slides, "Observe", "presentation slides", errors);

  if (slides.includes("OpenRouter") || slides.includes("openrouter")) {
    errors.push("presentation slides: OpenRouter wording is stale");
  }
} else {
  console.warn(`Presentation slides not found, skipped: ${presentationSlidesPath}`);
}

if (errors.length > 0) {
  console.error("Workshop docs check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Workshop docs check passed.");

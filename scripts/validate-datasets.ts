import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  INTENTIONALLY_BROKEN_DATASET,
  REQUIRED_DATASET_FILES,
  formatDatasetIssue,
  loadJsonlFile,
} from "../src/datasets/jsonl";

const args = new Set(process.argv.slice(2));
const strictBroken = args.has("--strict-broken");

async function main(): Promise<void> {
  let failureCount = 0;

  for (const relativePath of REQUIRED_DATASET_FILES) {
    const filePath = resolve(relativePath);

    if (!existsSync(filePath)) {
      console.error(`missing ${relativePath}`);
      failureCount += 1;
      continue;
    }

    const result = await loadJsonlFile(filePath);
    const parseIssues = result.issues.filter(
      (issue) => issue.code === "json_parse",
    );
    const schemaIssues = result.issues.filter((issue) => issue.code === "schema");
    const isBrokenFixture = relativePath === INTENTIONALLY_BROKEN_DATASET;

    if (parseIssues.length > 0) {
      console.error(`fail ${relativePath}: JSONL parse errors`);
      for (const issue of parseIssues) {
        console.error(`  ${formatDatasetIssue(issue)}`);
      }
      failureCount += 1;
      continue;
    }

    if (isBrokenFixture && !strictBroken) {
      if (schemaIssues.length === 0) {
        console.warn(
          `warn ${relativePath}: broken fixture is currently schema-valid`,
        );
      } else {
        console.log(
          `ok ${relativePath}: ${schemaIssues.length} expected schema issue(s) for the repair lab`,
        );
      }
      continue;
    }

    if (schemaIssues.length > 0) {
      console.error(`fail ${relativePath}: schema validation errors`);
      for (const issue of schemaIssues) {
        console.error(`  ${formatDatasetIssue(issue)}`);
      }
      failureCount += 1;
      continue;
    }

    console.log(`ok ${relativePath}: ${result.records.length} record(s)`);
  }

  if (failureCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

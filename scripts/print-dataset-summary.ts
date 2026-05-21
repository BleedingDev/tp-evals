import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  REQUIRED_DATASET_FILES,
  loadJsonlFile,
} from "../src/datasets/index.ts";

function countBy<T extends string>(values: T[]): string {
  const counts = new Map<T, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => `${value}:${count}`)
    .join(", ");
}

const rows: string[] = [];

async function main(): Promise<void> {
  for (const relativePath of REQUIRED_DATASET_FILES) {
    const filePath = resolve(relativePath);

    if (!existsSync(filePath)) {
      rows.push(`${relativePath} | missing | - | - | - | issues:1`);
      continue;
    }

    const result = await loadJsonlFile(filePath);
    const capabilities = countBy(result.records.map((record) => record.capability));
    const caseTypes = countBy(result.records.map((record) => record.caseType));
    const risks = countBy(result.records.map((record) => record.risk));
    const issueCount = result.issues.length;

    rows.push(
      `${relativePath} | ${result.records.length}/${result.totalJsonRecords} valid | ${capabilities || "-"} | ${caseTypes || "-"} | ${risks || "-"} | issues:${issueCount}`,
    );
  }

  console.log("file | valid/json | capabilities | case types | risks | issues");
  console.log("--- | --- | --- | --- | --- | ---");
  for (const row of rows) {
    console.log(row);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

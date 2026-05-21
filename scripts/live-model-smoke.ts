import { loadWorkshopEnv } from "../src/env.js";
import {
  getLiveProviderName,
  getLiveModelName,
  translateWithLiveModel,
} from "../src/providers/live-model.js";

loadWorkshopEnv();

const result = await translateWithLiveModel({
  sourceLanguage: "en",
  targetLanguage: "es",
  sourceText: "Hi {{first_name}}, you have {{count}} saved filters.",
  context: "Mobile notification preview.",
  placeholders: ["{{first_name}}", "{{count}}"],
  protectedTerms: [],
});

console.log("Live model smoke check passed.");
console.log(`Provider: ${getLiveProviderName()}`);
console.log(`Model: ${getLiveModelName()}`);
console.log(`Output length: ${result.text.length}`);
console.log(`Preserved fragments: ${result.preservedFragments.length}`);

import { loadWorkshopEnv } from "../src/env.js";
import {
  getLiveProviderName,
  getOpenRouterModel,
  translateWithOpenRouter,
} from "../src/providers/openrouter.js";

loadWorkshopEnv();

const result = await translateWithOpenRouter({
  sourceLanguage: "en",
  targetLanguage: "es",
  sourceText: "Hi {{first_name}}, you have {{count}} saved filters.",
  context: "Mobile notification preview.",
  placeholders: ["{{first_name}}", "{{count}}"],
  protectedTerms: [],
});

console.log("Live model smoke check passed.");
console.log(`Provider: ${getLiveProviderName()}`);
console.log(`Model: ${getOpenRouterModel()}`);
console.log(`Output length: ${result.text.length}`);
console.log(`Preserved fragments: ${result.preservedFragments.length}`);

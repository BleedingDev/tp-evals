import {
  createTrace,
  type CapabilityRunOptions,
  type MockVariant,
  type TranslationInput,
  type TranslationOutput,
} from "./types.js";

const improvedTranslations: Readonly<Record<string, string>> = {
  "es::Save changes": "Guardar cambios",
  "es::Cancel subscription": "Cancelar suscripcion",
  "es::The pass is valid until Friday.":
    "El pase es valido hasta Friday.",
  "es::Hi {{first_name}}, you have {{count}} saved filters.":
    "Hola {{first_name}}, tienes {{count}} filtros guardados.",
  "fr::<strong>Warning:</strong> restart before removing KIT-42.":
    "<strong>Avertissement :</strong> redemarrez avant de retirer KIT-42.",
  "de::Use mode AX-19 only with the test fixture.":
    "Verwenden Sie Modus AX-19 nur mit der Test-Fixture.",
  "es::Tap Drawer to reopen the panel. Drawer stays pinned after restart.":
    "Toca Panel lateral para volver a abrir el panel. Panel lateral permanece fijado despues de reiniciar.",
  "es::Retry": "Reintentar",
  "fr::Open settings": "Ouvrir les parametres",
  "es::Close panel": "Cerrar panel",
};

const baselineTranslations: Readonly<Record<string, string>> = {
  "es::Save changes": "Guardar cambios",
  "es::Cancel subscription": "Cancelar suscripcion",
  "es::The pass is valid until Friday.":
    "La contrasena es valida hasta el viernes.",
  "es::Hi {{first_name}}, you have {{count}} saved filters.":
    "Hola {{first_name}}, tienes {{count}} filtros guardados.",
  "fr::<strong>Warning:</strong> restart before removing KIT-42.":
    "<strong>Avertissement :</strong> redemarrez avant de retirer KIT-42.",
  "de::Use mode AX-19 only with the test fixture.":
    "Verwenden Sie Modus AX-19 nur mit der Test-Fixture.",
  "es::Tap Drawer to reopen the panel. Drawer stays pinned after restart.":
    "Toca Drawer para volver a abrir el panel. Drawer permanece fijado despues de reiniciar.",
  "es::Retry": "Reintentar",
  "fr::Open settings": "Ouvrir les parametres",
  "es::Close panel": "Cerrar panel",
};

const keyFor = (input: TranslationInput): string =>
  `${input.targetLanguage.toLowerCase()}::${input.sourceText}`;

const unique = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (value.length === 0 || seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
};

const inlineTags = (sourceText: string): string[] => {
  return [...sourceText.matchAll(/<\/?[A-Za-z][^>]*>/gu)].map(
    (match) => match[0] ?? "",
  );
};

const fragmentsToPreserve = (input: TranslationInput): string[] => {
  return unique([
    ...(input.placeholders ?? []),
    ...(input.protectedTerms ?? []),
    ...inlineTags(input.sourceText),
  ]);
};

const genericTranslation = (input: TranslationInput): string => {
  const target = input.targetLanguage.toLowerCase();

  if (target === "es") {
    return input.sourceText;
  }

  if (target === "fr") {
    return input.sourceText;
  }

  if (target === "de") {
    return input.sourceText;
  }

  return input.sourceText;
};

const makeOutput = (
  input: TranslationInput,
  variant: MockVariant,
  text: string,
  failureModes: readonly string[] = [],
): TranslationOutput => {
  const fragments = fragmentsToPreserve(input);
  const preservedFragments = fragments.filter((fragment) =>
    text.includes(fragment),
  );
  const changedFragments = fragments.filter(
    (fragment) => !text.includes(fragment),
  );
  const addedExplanation = /\b(translation|here is|because|i translated)\b/iu.test(
    text,
  );

  return {
    capability: "translation",
    variant,
    text,
    preservedFragments,
    changedFragments,
    addedExplanation,
    trace: createTrace("translation", variant, failureModes),
  };
};

const improvedTranslation = (input: TranslationInput): TranslationOutput => {
  const translated = improvedTranslations[keyFor(input)] ?? genericTranslation(input);
  return makeOutput(input, "improved", translated);
};

const baselineTranslation = (input: TranslationInput): TranslationOutput => {
  const key = keyFor(input);
  const translated =
    baselineTranslations[key] ??
    improvedTranslations[key] ??
    genericTranslation(input);

  const failureModes: string[] = [];
  if (input.sourceText.includes("The pass is valid")) {
    failureModes.push("terminology");
  }
  if (input.sourceText.includes("Drawer")) {
    failureModes.push("glossary-term-not-applied");
  }

  return makeOutput(input, "baseline", translated, failureModes);
};

const flawedTranslation = (input: TranslationInput): TranslationOutput => {
  const sourceText = input.sourceText;
  let translated: string;
  const failureModes: string[] = [];

  switch (sourceText) {
    case "Save changes":
      translated = "Here is the translation: Guardar cambios.";
      failureModes.push("explanation-text");
      break;
    case "Cancel subscription":
      translated = "Pausar suscripcion";
      failureModes.push("terminology", "meaning-shift");
      break;
    case "The pass is valid until Friday.":
      translated = "La contrasena es valida hasta el viernes.";
      failureModes.push("terminology");
      break;
    case "Hi {{first_name}}, you have {{count}} saved filters.":
      translated = "Hola first_name, tienes varios filtros guardados.";
      failureModes.push("placeholder-changed", "unsupported-count");
      break;
    case "<strong>Warning:</strong> restart before removing KIT-42.":
      translated = "<strong>Avertissement: redemarrez avant de retirer KIT 42.";
      failureModes.push("tag-changed", "protected-term-changed");
      break;
    case "Use mode AX-19 only with the test fixture.":
      translated = "Use el modo AX19 solo con el dispositivo de prueba.";
      failureModes.push("protected-term-changed", "glossary-term-not-applied");
      break;
    case "Tap Drawer to reopen the panel. Drawer stays pinned after restart.":
      translated =
        "Toca el cajon para volver a abrir el panel. La gaveta permanece fijada despues de reiniciar.";
      failureModes.push("terminology", "inconsistent-term");
      break;
    default:
      translated = `Here is the translation: ${genericTranslation(input)}`;
      failureModes.push("explanation-text");
      break;
  }

  return makeOutput(input, "flawed", translated, failureModes);
};

export const translate = (
  input: TranslationInput,
  options: CapabilityRunOptions = {},
): TranslationOutput => {
  const variant = options.variant ?? "baseline";

  if (variant === "flawed") {
    return flawedTranslation(input);
  }

  if (variant === "improved") {
    return improvedTranslation(input);
  }

  return baselineTranslation(input);
};

export const translationVariants = {
  baseline: baselineTranslation,
  flawed: flawedTranslation,
  improved: improvedTranslation,
} as const satisfies Record<MockVariant, (input: TranslationInput) => TranslationOutput>;

export type Language = "en" | "ur" | "sd";
export type TranslationCatalog = Record<string, { ur: string; sd: string }>;
export type TranslationParams = Record<string, string | number>;

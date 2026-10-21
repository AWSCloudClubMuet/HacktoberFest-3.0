import { common } from "./catalogs/common";
import { shell } from "./catalogs/shell";
import { records } from "./catalogs/records";
import { operations } from "./catalogs/operations";
import { field } from "./catalogs/field";
import { getLanguage } from "./language";
import type { Language, TranslationCatalog, TranslationParams } from "./types";

export const catalog: TranslationCatalog = { ...records, ...operations, ...field, ...shell, ...common };

export function translate(language: Language, key: string, params: TranslationParams = {}) {
  const text = language === "en" ? key : catalog[key]?.[language] ?? key;
  return text.replace(/\{(\w+)\}/g, (token, name: string) => Object.hasOwn(params, name) ? String(params[name]) : token);
}

/** For formatting and non-React integrations such as map markers. */
export const tr = (key: string, params?: TranslationParams) => translate(getLanguage(), key, params);

/** Translate server validation messages without changing their data or error contracts. */
export function translateMessage(language: Language, message: string) {
  if (language === "en") return message;
  if (catalog[message]) return translate(language, message);
  for (const key of Object.keys(catalog)) {
    if (!/\{\w+\}/.test(key)) continue;
    const names: string[] = [];
    const pattern = key.split(/(\{\w+\})/).map((part) => {
      if (/^\{\w+\}$/.test(part)) { names.push(part.slice(1, -1)); return "(.+?)"; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("");
    const match = message.match(new RegExp(`^${pattern}$`));
    if (match) {
      const params = Object.fromEntries(names.map((name, i) => {
        const value = match[i + 1];
        const known = Object.keys(catalog).find((entry) => entry.toLowerCase() === value.toLowerCase());
        return [name, known ? translate(language, known) : value];
      }));
      return translate(language, key, params);
    }
  }
  return message;
}

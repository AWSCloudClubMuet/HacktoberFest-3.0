import { useI18n, type Language } from "../i18n";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return (
    <label className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-line-strong bg-paper px-2.5 text-ink shadow-card focus-within:border-ink">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a18 18 0 010 18 18 18 0 010-18" /></svg>
      <span className="sr-only">{t("Language")}</span>
      <select aria-label={t("Language")} value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="min-w-0 cursor-pointer bg-transparent py-1 pe-1 text-sm font-medium outline-none">
        <option value="en" lang="en">English</option>
        <option value="ur" lang="ur">اردو</option>
        <option value="sd" lang="sd">سنڌي</option>
      </select>
    </label>
  );
}

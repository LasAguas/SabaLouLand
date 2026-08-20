import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, getContent } from "./content";

const KEY = "sll:lang";
const LanguageContext = createContext(null);

const isKnown = (code) => LANGUAGES.some((l) => l.code === code);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);

  // Read the stored / browser preference after mount so the server and the
  // first client render agree (no hydration mismatch).
  useEffect(() => {
    let next = null;
    try {
      const stored = window.localStorage.getItem(KEY);
      if (isKnown(stored)) next = stored;
    } catch {}
    if (!next) {
      const guess = (navigator.language || "").slice(0, 2).toLowerCase();
      if (isKnown(guess)) next = guess;
    }
    if (next && next !== DEFAULT_LANGUAGE) setLang(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = getContent(lang).htmlLang;
    try {
      window.localStorage.setItem(KEY, lang);
    } catch {}
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t: getContent(lang), languages: LANGUAGES }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

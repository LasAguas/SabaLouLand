import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "sll:theme";
const ThemeContext = createContext(null);

// Kept in sync with the inline no-flash script in pages/_document.js.
// If you change the storage key or the default here, change it there too.
export const THEME_BOOT_SCRIPT = `
(function(){try{
  var s=localStorage.getItem('${KEY}');
  var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
  document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  // The boot script already painted the right theme; adopt whatever it chose.
  useEffect(() => {
    const applied = document.documentElement.getAttribute("data-theme");
    if (applied === "light" || applied === "dark") setTheme(applied);
  }, []);

  const apply = useCallback((next) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    apply(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
  }, [apply]);

  const value = useMemo(() => ({ theme, setTheme: apply, toggle }), [theme, apply]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

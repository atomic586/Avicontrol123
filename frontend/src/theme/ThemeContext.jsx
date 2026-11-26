import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [modoOscuro, setModoOscuro] = useState(
    () => window.localStorage.getItem("avicontrol-tema") === "oscuro"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = modoOscuro ? "dark" : "light";
    window.localStorage.setItem("avicontrol-tema", modoOscuro ? "oscuro" : "claro");
  }, [modoOscuro]);

  return (
    <ThemeContext.Provider value={{ modoOscuro, alternarTema: () => setModoOscuro((actual) => !actual) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return context;
}

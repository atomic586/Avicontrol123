import { createContext, useContext, useState } from "react";

const GranjaContext = createContext();

export function GranjaProvider({ children }) {
  const [granjaActiva, setGranjaActiva] = useState(null);

  return (
    <GranjaContext.Provider value={{ granjaActiva, setGranjaActiva }}>
      {children}
    </GranjaContext.Provider>
  );
}

export function useGranja() {
  const ctx = useContext(GranjaContext);
  if (!ctx) throw new Error("useGranja debe usarse dentro de GranjaProvider");
  return ctx;
}
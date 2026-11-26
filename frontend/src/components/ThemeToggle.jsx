import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";

export default function ThemeToggle() {
  const { modoOscuro, alternarTema } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={alternarTema}
      aria-pressed={modoOscuro}
      aria-label={modoOscuro ? "Activar modo claro" : "Activar modo oscuro"}
      title={modoOscuro ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {modoOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="hidden sm:inline">{modoOscuro ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}

import { useModulos } from "../hooks/useModulos";

export function ModuloGate({ codigo, children, fallback = null }) {
  const { tieneModulo, loading } = useModulos();
  if (loading) return null;
  if (!tieneModulo(codigo)) {
    return fallback ?? (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg font-bold">Módulo no disponible</p>
        <p className="text-sm">Este módulo no está activo para tu granja.</p>
      </div>
    );
  }
  return children;
}
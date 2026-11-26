import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

const TOKEN_KEY = "avicontrol_token";
const REFRESH_KEY = "avicontrol_refresh";
const USER_KEY = "avicontrol_user";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar, rehidratar el usuario desde localStorage
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (token && userJson) {
      try {
        const decoded = jwtDecode(token);
        const ahora = Date.now() / 1000;
        if (decoded.exp && decoded.exp < ahora) {
          cerrarSesion();
        } else {
          setUsuario(JSON.parse(userJson));
        }
      } catch {
        cerrarSesion();
      }
    }
    setCargando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iniciarSesion = (access, refresh, user) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUsuario(user);
  };

  const cerrarSesion = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUsuario(null);
  };

  // ============================================
  // ROLES DINÁMICOS (para usar en toda la app)
  // ============================================
  const roles = usuario?.roles?.map((r) => r.codigo) || [];
  const esSuperadmin = roles.includes("superadmin");
  const esAdminGranja = roles.includes("admin_granja");
  const esVentas = roles.includes("encargado_ventas");
  const esProduccion = roles.includes("encargado_produccion");
  const esAlmacen = roles.includes("encargado_almacen");

  const tieneRol = (rolesPermitidos) => {
    if (!usuario) return false;
    return rolesPermitidos.some((r) => roles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        cerrarSesion,
        roles,
        esSuperadmin,
        esAdminGranja,
        esVentas,
        esProduccion,
        esAlmacen,
        tieneRol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
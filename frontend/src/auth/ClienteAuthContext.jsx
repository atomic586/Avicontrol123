import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const ClienteAuthContext = createContext(null);

const TOKEN_KEY = "avicontrol_cliente_token";
const REFRESH_KEY = "avicontrol_cliente_refresh";
const USER_KEY = "avicontrol_cliente_user";

export function ClienteAuthProvider({ children }) {
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

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
          setCliente(JSON.parse(userJson));
        }
      } catch {
        cerrarSesion();
      }
    }
    setCargando(false);
  }, []);

  const iniciarSesion = (access, refresh, user) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCliente(user);
  };

  const cerrarSesion = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setCliente(null);
  };

  return (
    <ClienteAuthContext.Provider value={{ cliente, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </ClienteAuthContext.Provider>
  );
}

export function useClienteAuth() {
  const ctx = useContext(ClienteAuthContext);
  if (!ctx) throw new Error("useClienteAuth debe usarse dentro de <ClienteAuthProvider>");
  return ctx;
}
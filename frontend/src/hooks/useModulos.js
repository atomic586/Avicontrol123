import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const MODULOS_ACTIVOS = gql`
  query ModulosActivos {
    modulosActivos
  }
`;

export function useModulos() {
  const { data, loading, error, refetch } = useQuery(MODULOS_ACTIVOS, {
    fetchPolicy: "cache-and-network",
    skip: !localStorage.getItem("avicontrol_token"),
  });

  const modulos = data?.modulosActivos ?? [];
  const tieneModulo = (codigo) => modulos.includes(codigo);

  return { modulos, tieneModulo, loading, error, refetch };
}
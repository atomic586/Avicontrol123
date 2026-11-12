import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Endpoint GraphQL del backend Django (AVICONTROL)
const uri =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000/graphql/`;

const httpLink = createHttpLink({ uri });

// Adjunta el token JWT (staff y cliente) a cada petición
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("avicontrol_token");
  const clienteToken = localStorage.getItem("avicontrol_cliente_token");
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(clienteToken ? { "x-cliente-token": `Bearer ${clienteToken}` } : {}),
    },
  };
});

export const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

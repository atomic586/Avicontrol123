import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Endpoint GraphQL del backend Django (AVICONTROL)
const httpLink = createHttpLink({
  uri: "http://127.0.0.1:8000/graphql/",
});

// Adjunta el token JWT (si existe) a cada petición
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("avicontrol_token");
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
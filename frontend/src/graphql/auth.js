import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      access
      refresh
      usuario {
        id
        username
        email
        nombres
        apellidos
        granjaId
        roles { codigo nombre }
      }
    }
  }
`;

export const ME_MUTATION = gql`
  mutation Me {
    me {
      id
      username
      email
      nombres
      apellidos
      granjaId
      roles { codigo nombre }
    }
  }
`;
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins"

const authURL =
  import.meta.env.VITE_BETTER_AUTH_URL ??
  `http://localhost:8000`;


export const authClient = createAuthClient({
  baseURL: authURL
});

export const { signIn, signUp, useSession } = createAuthClient({
  plugins: [ jwtClient() ]
})

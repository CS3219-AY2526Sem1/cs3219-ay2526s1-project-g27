import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const authURL =
  import.meta.env.VITE_BETTER_AUTH_URL ??
  `http://localhost:8000`;

// Create ONE auth client with the JWT plugin
export const authClient = createAuthClient({
  baseURL: authURL,
  plugins: [
    jwtClient() 
  ]
});

export const { signIn, signUp, useSession } = authClient;
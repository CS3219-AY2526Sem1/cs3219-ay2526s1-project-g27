import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: "http://localhost:8000" //NOTE: HARD-CODED, SWAP IT 
});

export const { signIn, signUp, useSession } = createAuthClient({
  plugins: [ jwtClient() ]
})

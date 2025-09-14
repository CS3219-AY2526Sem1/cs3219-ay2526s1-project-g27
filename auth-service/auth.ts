import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client} from "./models/db";


export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,//defaults to true
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
    }, 
  }, 
  database: mongodbAdapter(client),
});
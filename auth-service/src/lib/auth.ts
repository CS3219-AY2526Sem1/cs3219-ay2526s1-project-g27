import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from 'mongodb';

const client = new MongoClient("mongodb://localhost:27017/database");
const db = client.db();

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
  database: mongodbAdapter(db, {}),
});
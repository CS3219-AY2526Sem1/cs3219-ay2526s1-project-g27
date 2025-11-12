/*
# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5), Claude 4.5 Sonnet 
# Scope: 
# -  Make small amendments such as email verification functions 
# Author review: 
# - Verify through running 
# - Read the code 
# */

import { betterAuth } from "better-auth";
import { jwt, openAPI } from "better-auth/plugins"
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { Resend } from 'resend';
import { render } from '@react-email/render';
import VerificationEmail from './emails/VerificationEmail';
import express from "express";




const client = new MongoClient(process.env.DB_LOCAL_URI as string);
const db = client.db(process.env.DB_NAME as string);
const resend = new Resend(process.env.RESEND_API_KEY);


export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date; 
  updatedAt: Date;
};


export const auth = betterAuth({
  trustedOrigins: [process.env.FRONTEND_URL as string, process.env.BASE_URL as string, 'http://localhost:5173'],
  baseURL:  process.env.FRONTEND_URL as string, 

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({user, url, token}, request) => {
      const frontendUrl = new URL(url);
      frontendUrl.host = new URL(process.env.FRONTEND_URL as string).host;
      const emailHtml = await render(
        VerificationEmail({ userName: user.name,verificationUrl: frontendUrl.toString()})
      );

      await resend.emails.send({
        from: process.env.EMAIL_FROM as string,
        to: user.email,
        subject: 'Verify your email',
        html: emailHtml 
      });
    },
    onPasswordReset: async ({ user }, request) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },

  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (refresh session every day)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache for 5 minutes
    }
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user,
      url
    }: {
      user: { email: string; name: string };
      url: string;
    }) => {
      

      const frontendUrl = new URL(url);
      frontendUrl.protocol = "http:";
      frontendUrl.hostname = "localhost";
      frontendUrl.port = "80"; // your frontend dev port
      const verificationLink = frontendUrl.toString();
      const emailHtml = await render(
        VerificationEmail({ userName: user.name,verificationUrl: verificationLink})
      );

      await resend.emails.send({
        from: process.env.EMAIL_FROM as string,
        to: user.email,
        subject: 'Verify your email',
        html: emailHtml 
      });
    },
    async afterEmailVerifcation({user, request}: {user: User, request: express.Request}) {
      try {
        const profileCollection = db.collection("profiles");
        await profileCollection.insertOne({
          userId: user.id,
          problemsSolved: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log("Profile created for user: After verifcation", user.id);
      } catch (error) {
        console.error("Error creating profile for user:", user.id, error);
      }
    }
    
  },


  user: {
    additionalFields: {
      currentRating: {
        type: "number",
        required: true,
        defaultValue: 1000, 
        input: false
      },
    }
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const profileCollection = db.collection("profiles");
            await profileCollection.insertOne({
              userId: user.id,
              problemsSolved: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              biography: "",
              handles: [],
            });

            console.log("Profile created for user:", user.id);
          } catch (error) {
            console.error("Error creating profile for user:", user.id, error);
          }
        }
      }
    }
  },
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.AUTH_SERVICE_BASE_URL || "http://auth-service:8000",
        audience: process.env.AUTH_SERVICE_BASE_URL || "http://auth-service:8000",
        expirationTime: "30m"
      }
    }),
    openAPI(),
  ],
  
  database: mongodbAdapter(db, {})
});
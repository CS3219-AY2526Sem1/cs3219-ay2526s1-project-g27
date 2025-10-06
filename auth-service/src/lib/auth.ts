import { betterAuth } from "better-auth";
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
  email: string;
  name: string;
  emailVerified: boolean;
  image: string;
  createdAt: Date; 
  updatedAt: Date;
  handle: string;
  currentRating: number;
};



export const auth = betterAuth({
  trustedOrigins: [process.env.FRONTEND_URL as string],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false, 
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
      const emailHtml = await render(
        VerificationEmail({ userName: user.name, verificationUrl: url })
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
          handle: (user as any).handle || null,
          currentRating: 1000,
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
      handle: {
        type: "string",
        required: false,
        input: true 
      },
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
              handle: (user as any).handle || null,
              currentRating: 1000,
              problemsSolved: [],
              createdAt: new Date(),
              updatedAt: new Date()
            });

            console.log("Profile created for user:", user.id);
          } catch (error) {
            console.error("Error creating profile for user:", user.id, error);
          }
        }
      }
    }
  },
  
  database: mongodbAdapter(db, {})
});
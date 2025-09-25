import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from 'mongodb';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import VerificationEmail from './emails/VerificationEmail';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set!");
}

const client = new MongoClient(databaseUrl);
const db = client.db();
const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  trustedOrigins: [process.env.FRONTEND_URL as string],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false, 
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      const emailHtml = await render(
        <VerificationEmail 
          userName={user.name} 
          verificationUrl={url} 
        />
      );

      console.log(`Sending verification email to ${user.email}`);
      await resend.emails.send({
        from: 'Your App Name <onboarding@yourdomain.com>', // Must be a verified domain in Resend
        to: user.email,
        subject: 'Verify Your Email Address to Get Started',
        html: emailHtml,
        text: `Welcome! Please click the following link to verify your email address: ${url}`,
      });
    }
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,}
  },
  database: mongodbAdapter(db, {}),
});


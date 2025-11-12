/*
# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5), Claude 4.5 Sonnet 
# Scope: 
# - Initial type template 
# Author review: 
# - MongoDB compass  
*/
import { ObjectId } from "mongodb";
import { z } from "zod";

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date; 
  updatedAt: Date;
  currentRating: number;
};

export const UserSchema = z.object({
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  currentRating: z.number().int()
});

type UserData = z.infer<typeof UserSchema>
export interface UserAuth extends UserData {
  _id: ObjectId;
}

export const solvedProblemSchema = z.object({
  problemId: z.string(),
  solvedAt: z.date(),
  language: z.string(),
});

export const profileSchema = z.object({
  userId: z.string(), 
  handles: z.array(z.string()).default([]),
  currentRating: z.number().int(),
  problemsSolved: z.array(solvedProblemSchema).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  biography: z.string().default(""),
});

type BaseProfile = z.infer<typeof profileSchema>;

export interface UserProfile extends BaseProfile {
  _id: ObjectId;
}

export type SolvedProblem = z.infer<typeof solvedProblemSchema>;
export type CreateProfileInput = Omit<BaseProfile, "createdAt" | "updatedAt" | "problemsSolved"> & {
  problemsSolved?: SolvedProblem[];
};
export type UpdateProfileInput = Partial<Omit<BaseProfile, "userId" | "createdAt">>;
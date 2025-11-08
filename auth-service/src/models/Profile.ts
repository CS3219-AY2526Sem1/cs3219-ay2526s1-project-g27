import { ObjectId } from "mongodb";
import { z } from "zod";

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
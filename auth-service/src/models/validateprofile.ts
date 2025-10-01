import { ObjectId } from "mongodb";
import {z} from "zod";

const mongoose = require("mongoose");

export const solvedProblemSchema = z.object({
    problemId: z.string(), // NOTE: Replace this with z.instanceof(ObjectId) if we are referencing the question 
    solvedAt: z.date(),
    language: z.string(),
});

export const profileSchema = z.object({
    userId: z.instanceof(ObjectId),
    handle: z.string().optional(),
    rank: z.string().optional(),
    currentRating: z.number().int(),
    problemsSolved: z.array(solvedProblemSchema).default([]),

    createdAt: z.date().default(new Date()),
    updatedAt: z.date().default(new Date()),
});


type  BaseProfile = z.infer<typeof profileSchema>;

export interface UserProfile extends BaseProfile {
    _id: ObjectId;
}

export type SolvedProblem = z.infer<typeof solvedProblemSchema>;
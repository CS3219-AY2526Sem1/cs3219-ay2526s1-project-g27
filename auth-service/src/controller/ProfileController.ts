
/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025-9-14, 2025-9-20, 2025-10-05
Scope: 
- Generated initial code
- Added boilerplate code for some endpoints based on schema
- Debugging 
Author review: 
- Verfied for correctness by reading code
*/


import { Request, Response } from "express";
import { getProfileCollection } from "../lib/db";

import {
  profileSchema,
  CreateProfileInput,
  UpdateProfileInput,
  solvedProblemSchema 
} from "../models/Profile";
import { z } from "zod";

const updateProfileSchema = z.object({
  handles: z.array(z.string()).optional(),
  biography: z.string().optional(),
  problemsSolved: z.array(solvedProblemSchema).optional(),
});

export class ProfileController {
  // GET /api/v1/users/:id/profile - Get user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // This is the Better Auth user ID (string)

      const profilesCollection = getProfileCollection();
      const profile = await profilesCollection.findOne({
        userId: id, // Better Auth uses string IDs
      });

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      res.status(200).json({ data: profile });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST /api/v1/users/:id/profile - Create user profile
  static async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Better Auth user ID (string)

      const profilesCollection = getProfileCollection();

      // Check if profile already exists
      const existingProfile = await profilesCollection.findOne({ userId: id });
      if (existingProfile) {
        res.status(409).json({ error: "Profile already exists for this user" });
        return;
      }

      // Validate input data
      const profileData: CreateProfileInput = {
        userId: id, // Better Auth user ID
        handles: req.body.handle,
        currentRating: req.body.currentRating || 1000,
        problemsSolved: req.body.problemsSolved || [],
        biography: "",
      };

      // Validate with Zod
      const validatedData = profileSchema.parse({
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await profilesCollection.insertOne(
        validatedData as any
      );

      const createdProfile = await profilesCollection.findOne({
        _id: result.insertedId,
      });

      res.status(201).json({
        message: "Profile created successfully",
        data: createdProfile,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error,
        });
        return;
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async patchProfile(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params; // This is the Better Auth user ID

        // 1. Validate the incoming request body
        const validation = updateProfileSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: "Validation error",
                details: validation.error,
            });
            return;
        }

        const validatedData = validation.data;

        // 2. Check if there is anything to update
        if (Object.keys(validatedData).length === 0) {
            res.status(400).json({ error: "No fields to update provided" });
            return;
        }

        // 3. Prepare the data for MongoDB
        const updateFields: any = {
            ...validatedData,
            updatedAt: new Date(),
        };

        const profilesCollection = getProfileCollection();

        // 4. Find the user profile and update it
        const result = await profilesCollection.findOneAndUpdate(
            { userId: id },
            { $set: updateFields },
            { returnDocument: "after" } // This option returns the updated document
        );

        // 5. Handle the case where the profile is not found
        if (!result) {
            res.status(404).json({ error: "Profile not found" });
            return;
        }

        // 6. Send the successful response
        res.status(200).json({
            message: "Profile updated successfully",
            data: result,
        });
    } catch (error) {
        // Handle potential Zod errors if not using safeParse
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: "Validation error",
                details: error,
            });
            return;
        }
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
  }

  // PUT /api/v1/users/:id/profile - Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Better Auth user ID

      const profilesCollection = getProfileCollection();

      // Prepare update data
      const updateData: UpdateProfileInput = {
        handle: req.body.handle,
        currentRating: req.body.currentRating,
        problemsSolved: req.body.problemsSolved,
        updatedAt: new Date(),
      };

      // Remove undefined fields
      const filteredUpdate = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(filteredUpdate).length === 0) {
        res.status(400).json({ error: "No valid fields to update" });
        return;
      }

      const result = await profilesCollection.findOneAndUpdate(
        { userId: id },
        { $set: filteredUpdate },
        { returnDocument: "after" }
      );

      if (!result) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      res.status(200).json({
        message: "Profile updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE /api/v1/users/:id/profile - Delete user profile
  static async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Better Auth user ID

      const profilesCollection = getProfileCollection();

      const result = await profilesCollection.deleteOne({ userId: id });

      if (result.deletedCount === 0) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /api/v1/users - List all user profiles
  static async getAllProfiles(req: Request, res: Response): Promise<void> {
    try {
      const profilesCollection = getProfileCollection();
      
      // Pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const profiles = await profilesCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await profilesCollection.countDocuments();

      res.status(200).json({
        data: profiles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

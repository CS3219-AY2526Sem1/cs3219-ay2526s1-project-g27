
/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025-9-14, 2025-9-25, 2025-11-09
Scope: 
- Generated initial code
- Added boilerplate code for some endpoints based on schema
- Debugging 
Author review: 
- Verfied for correctness by reading code
*/


import { Request, Response } from "express";
import { getProfileCollection, getUserCollection } from "../lib/db";
import { ObjectId } from "mongodb";
import {
  profileSchema,
  CreateProfileInput,
  UpdateProfileInput,
  solvedProblemSchema 
} from "../models/Profile";
import { z } from "zod";

const updateProfileSchema = z.object({
  username: z.string().optional(), 
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

  // PUT /api/v1/users/:id/profile - Update user profile
  static async patchProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // 1. Validate the user ID format
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid user ID format" });
        return;
      }

      // 2. Validate the incoming request body against your Zod schema
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: "Validation error",
          details: validation.error.flatten(),
        });
        return;
      }

      // 3. Separate username from other profile data
      const { username, ...otherProfileData } = validation.data;
      const userObjectId = new ObjectId(id);

      // 4. Update the username in the 'users' collection if a new one is provided
      if (username) {
        const userCollection = getUserCollection();
        try {
          const userUpdateResult = await userCollection.findOneAndUpdate(
            { _id: userObjectId },
            { $set: { name: username, updatedAt: new Date() } }
          );

          // If no document was found to update, the user doesn't exist.
          if (!userUpdateResult?._id) {
            res.status(404).json({ error: "User not found" });
            return;
          }
        } catch (error) {
          console.error("Error updating username in users collection:", error);
          res.status(500).json({ error: "Failed to update username" });
          return;
        }
      }

      // 5. Update the rest of the profile data in the 'profiles' collection
      const profilesCollection = getProfileCollection();
      if (Object.keys(otherProfileData).length > 0) {
        const updateFields = {
          ...otherProfileData,
          updatedAt: new Date(),
        };

        await profilesCollection.findOneAndUpdate(
          { userId: id }, // In the profiles collection, userId is a string
          { $set: updateFields }
        );
      }

      // 6. Fetch the complete, updated documents from both collections
      const updatedProfile = await profilesCollection.findOne({ userId: id });
      if (!updatedProfile) {
        // This case might happen if a user exists but has no profile document yet.
        // Depending on your application logic, you might want to create one here.
        res.status(404).json({ error: "Profile not found after update" });
        return;
      }

      const updatedUser = await getUserCollection().findOne({ _id: userObjectId });

      // 7. Send the successful response with the combined, updated data
      res.status(200).json({
        message: "Profile updated successfully",
        data: {
          ...updatedProfile,
          // Ensure the latest username from the users collection is sent back
          username: updatedUser?.name,
        },
      });

    } catch (error) {
      // Catch Zod validation errors specifically
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


  // NO LONGER USED 
  // static async updateProfile(req: Request, res: Response): Promise<void> {
  //   try {
  //     const { id } = req.params; // Better Auth user ID

  //     const profilesCollection = getProfileCollection();

  //     // Prepare update data
  //     const updateData: UpdateProfileInput = {
  //       currentRating: req.body.currentRating,
  //       problemsSolved: req.body.problemsSolved,
  //       updatedAt: new Date(),
  //     };

  //     // Remove undefined fields
  //     const filteredUpdate = Object.fromEntries(
  //       Object.entries(updateData).filter(([_, v]) => v !== undefined)
  //     );

  //     if (Object.keys(filteredUpdate).length === 0) {
  //       res.status(400).json({ error: "No valid fields to update" });
  //       return;
  //     }

  //     const result = await profilesCollection.findOneAndUpdate(
  //       { userId: id },
  //       { $set: filteredUpdate },
  //       { returnDocument: "after" }
  //     );

  //     if (!result) {
  //       res.status(404).json({ error: "Profile not found" });
  //       return;
  //     }

  //     res.status(200).json({
  //       message: "Profile updated successfully",
  //       data: result,
  //     });
  //   } catch (error) {
  //     console.error("Error updating profile:", error);
  //     res.status(500).json({ error: "Internal server error" });
  //   }
  // }

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

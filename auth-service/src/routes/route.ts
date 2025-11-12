/*
# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5), Claude 4.5 Sonnet 
# Scope: 
# -  Create template routes 
# Author review: 
# - Verify through running 
# - Read the code 
# */

import { Router } from "express";
import { ProfileController } from "../controller/ProfileController";
import { requireAuth, requireOwnership, optionalAuth } from "../middleware/AuthMiddleware";

const userRouter = Router();

// Public routes
// GET /api/v1/users - List all users (public with optional auth for filtering)
userRouter.get("/", optionalAuth, ProfileController.getAllProfiles);



// Protected routes - require authentication and ownership
// GET /api/v1/users/:id/profile - Get user profile (protected)
userRouter.get("/:id/profile", requireAuth, requireOwnership, ProfileController.getProfile);

// POST /api/v1/users/:id/profile - Create user profile (protected)
userRouter.post("/:id/profile", requireAuth, requireOwnership, ProfileController.createProfile);

// PUT /api/v1/users/:id/profile - Update user profile (protected)
userRouter.put("/:id/profile", requireAuth, requireOwnership, ProfileController.patchProfile);


export default userRouter;

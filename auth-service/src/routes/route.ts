import { Router } from "express";
import { ProfileController } from "../controller/profileController";
import { requireAuth, requireOwnership, optionalAuth } from "../middleware/authMiddleware";

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
userRouter.put("/:id/profile", requireAuth, requireOwnership, ProfileController.updateProfile);

// DELETE /api/v1/users/:id/profile - Delete user profile (protected)
// userRouter.delete("/:id/profile", requireAuth, requireOwnership, ProfileController.deleteProfile);

export default userRouter;

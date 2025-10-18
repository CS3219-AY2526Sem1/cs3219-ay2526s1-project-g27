import { Router } from "express";
import { AuthController } from "../controller/AuthController";

const authRouter = Router();

// Route for Nginx auth_request to verify JWT tokens
// GET /api/v1/auth/verify-jwt
authRouter.get("/verify-jwt", AuthController.validateToken);

export default authRouter;
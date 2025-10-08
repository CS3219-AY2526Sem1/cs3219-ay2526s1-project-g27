import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        [key: string]: any;
      };
      session?: any;
    }
  }
}

/**
 * Middleware to protect routes - requires authentication
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Better Auth automatically handles session cookies
    // We just need to call getSession with the request headers
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user || !session?.session) {
      res.status(401).json({ error: "Unauthorized - Please sign in" });
      return;
    }

    // Attach user and session to request
    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Unauthorized - Invalid session" });
  }
}

/**
 * Middleware to check if user can access their own resources
 */
export function requireOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { id } = req.params;
  
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Check if the user is trying to access their own resource
  if (req.user.id !== id) {
    res.status(403).json({ 
      error: "Forbidden - You can only access your own resources" 
    });
    return;
  }

  next();
}

/**
 * Optional auth - doesn't block if no token, but adds user if present
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session?.user && session?.session) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch (error) {
    // Silent fail - continue without user
    next();
  }
}
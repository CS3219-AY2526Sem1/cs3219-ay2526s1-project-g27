/*
# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5), Claude 4.5 Sonnet 
# Scope: 
# - Boiler plate code, types 
# Author review: 
# - Verify through running 
# - Read the code 
*/
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

/**
 * Middleware to check if user has a specific role
 * Must be used AFTER requireAuth middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'No role found for user' 
        });
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: `Required role: ${allowedRoles.join(' or ')}` 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to verify user role' 
      });
    }
  };
}
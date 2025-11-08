/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025-9-14, 2025-9-20, 2025-10-05
Scope: 
- Generated initial code
- Added JWT Token verification
- Debugging 
Author review: 
- Verfied for correctness by reading code
*/


import { createRemoteJWKSet, jwtVerify, JWTVerifyResult } from 'jose';
import { Request, Response } from "express";

// Cache JWKS outside the class to persist across requests
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksInitialized = false;

/**
 * Initialize JWKS once and cache it
 */
function getJWKS() {
  if (!cachedJWKS) {
    const jwksUrl = process.env.AUTH_SERVICE_JWKS;
    
    if (!jwksUrl) {
      throw new Error('AUTH_SERVICE_JWKS environment variable is not set');
    }

    console.log('🔐 Initializing JWKS from:', jwksUrl);
    cachedJWKS = createRemoteJWKSet(new URL(jwksUrl));
    jwksInitialized = true;
    console.log('✅ JWKS cache initialized successfully');
  }
  
  return cachedJWKS;
}

export class AuthController {
  // Endpoint for Nginx auth_request to verify JWT
  static async validateToken(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    
    // Log incoming request for Docker visibility
    console.log('🔍 [AUTH_VERIFY] Request received:', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!req.headers.authorization,
      timestamp: new Date().toISOString(),
      origin: req.headers.origin,
      referer: req.headers.referer,
      ip: req.ip
    });

    try {
      const authHeader = req.headers.authorization;
      let token = authHeader || '';
      while (token.startsWith('Bearer ')) {
        token = token.substring(7); 
      }      
      if (!token) {
        console.warn('⚠️  [AUTH_VERIFY] No token provided in request');
        return res.status(401).json({ 
          error: 'No token provided',
          message: 'Authorization header must be in format: Bearer {token}' 
        });
      }

      // Log token prefix for debugging (never log full token!)
      console.log('🔑 [AUTH_VERIFY] Token prefix:', token.substring(0, 20) + '...');

      // Get cached JWKS (initializes on first call)
      const JWKS = getJWKS();

      // Verify the JWT
      const { payload }: JWTVerifyResult = await jwtVerify(token, JWKS, {
        issuer: process.env.AUTH_SERVICE_BASE_URL || 'http://auth-service:8000',
        audience: process.env.AUTH_SERVICE_BASE_URL || 'http://auth-service:8000',
      });
      
      const duration = Date.now() - startTime;
      
      // Success logging - visible in Docker logs
      console.log('✅ [AUTH_VERIFY] JWT VALIDATED SUCCESSFULLY', {
        userId: payload.id,
        email: payload.email,
        duration: `${duration}ms`,
        jwksCached: jwksInitialized,
        timestamp: new Date().toISOString()
      });
      
      // Token is valid - return 200 for nginx auth_request
      return res.status(200).json({ 
        valid: true, 
        userId: payload.id,
        email: payload.email 
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Enhanced error logging for Docker visibility
      console.error('❌ [AUTH_VERIFY] JWT validation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Log full error stack in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error stack:', error);
      }
      
      // Return 401 for invalid tokens (nginx will block the request)
      return res.status(401).json({ 
        error: 'Invalid token',
        message: error instanceof Error ? error.message : 'Token verification failed'
      });
    }
  }

  /**
   * Health check endpoint to verify JWKS is initialized
   */
  static async healthCheck(req: Request, res: Response): Promise<Response> {
    console.log('🏥 [HEALTH] Auth service health check');
    
    return res.status(200).json({
      status: 'ok',
      jwksInitialized,
      timestamp: new Date().toISOString(),
      env: {
        hasJwksUrl: !!process.env.AUTH_SERVICE_JWKS,
        issuer: process.env.AUTH_SERVICE_BASE_URL || 'http://auth-service:8000'
      }
    });
  }
}


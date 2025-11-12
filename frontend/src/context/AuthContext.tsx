/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5), Gemini 2.5 Pro
Scope: 
- Generated Initial boiler plate
- Iterative improvement as auth changes , used documentation alogn with prompts
- Debugging 
Author review: 
- Verfied for correctness by reading code
- Tested using local 
*/

import { createContext, useContext, useState, useEffect, type ReactNode, type FC } from 'react';
import type { User, AuthContextType } from '@/types';
import { authClient } from '@/lib/auth-client'; 
import { setAuthToken } from '@/api/apiClient';

export interface CustomAuthContextType extends AuthContextType {
  jwt: string | null;
  isLoading: boolean;
  refreshJwt: () => Promise<void>;
  refreshSession: () => Promise<any>; 
  requestPasswordReset: (email: string, redirectTo?: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<any>;
}

export const AuthContext = createContext<CustomAuthContextType | null>(null);

export const useAuth = (): CustomAuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  // JSON Web Token for token based auth
  const [jwt, setJwt] = useState<string | null>(null);

  // 1. Manage Session State
  const { data: session, isPending: isLoading, error: sessionError, refetch: revalidateSession } = authClient.useSession();

  if (sessionError) {
    console.error("Error fetching session:", sessionError);
  }

  // 2. Fetch JWT token when session is available
  const fetchJwtToken = async () => {
    if (!session?.user) {
      console.log('No session available, clearing JWT');
      setJwt(null);
      setAuthToken(null);
      return;
    }

    try {
      
      const { data, error } = await authClient.token();
      
      if (error) {
        console.error('Error fetching JWT token:', error);
        setJwt(null);
        setAuthToken(null);
        return;
      }

      if (data?.token) {
        setJwt(data.token);
        setAuthToken(data.token);
      } else {
        setJwt(null);
        setAuthToken(null);
      }
    } catch (error) {
      setJwt(null);
      setAuthToken(null);
    }
  };

  // Fetch JWT when session changes
  useEffect(() => {
    if (session?.user) {
      fetchJwtToken();
    } else {
      setJwt(null);
      setAuthToken(null);
    }
  }, [session?.user?.id]); // Only re-fetch when user ID changes

  // 3. Map Session to User
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    username: session.user.name 
  } : null;

  const isAuthenticated = !!user;

  const refreshSession = async () => {
    console.log("Triggering session revalidation...");
    await revalidateSession();
    await refreshJwt();
    console.log("Session revalidation complete.");
  };

  const login = async (credentials: { email: string; password: string }) => {
    const result = await authClient.signIn.email(credentials);
    if (result.error) {
      console.error("Login error:", result.error.message);
    } else {
      // Fetch JWT after successful login
      await fetchJwtToken();
    }
    return result; 
  };

  const signup = async (credentials: { email: string; password: string; name: string }) => {
    const frontendUrl = import.meta.env.FRONTEND_URL;

    const result = await authClient.signUp.email({
      email: credentials.email,
      password: credentials.password,
      name: credentials.name,
      callbackURL: frontendUrl, 
    });

    if (result.error) {
      console.error("Signup error:", result.error.message);
    } else {
      // Fetch JWT after successful signup
      await fetchJwtToken();
    }

    return result;
  };

  const requestPasswordReset = async (email: string, redirectTo?: string) => {
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo, // optional: where user will be redirected to handle token
      });

      if (result.error) {
        console.error("Request password reset error:", result.error.message);
      }

      return result;
    } catch (error) {
      console.error("Request password reset exception:", error);
      return { error };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const result = await authClient.resetPassword({
        token,
        newPassword,
      });

      if (result.error) {
        console.error("Reset password error:", result.error.message);
      } else {
        // optional: fetch a fresh JWT/session after successful reset
        await fetchJwtToken();
      }

      return result;
    } catch (error) {
      console.error("Reset password exception:", error);
      return { error };
    }
  };



  const logout = async () => {
    await authClient.signOut();
    setJwt(null);
    setAuthToken(null);
  };

  // Manual JWT refresh function
  const refreshJwt = async () => {
    await fetchJwtToken();
  };

  // 4. Provide Values
  const value: CustomAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    jwt, 
    login,
    logout,
    signup,
    refreshJwt,
    refreshSession,
    requestPasswordReset,
    resetPassword,

  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
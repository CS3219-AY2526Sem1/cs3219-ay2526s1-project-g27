import { createContext, useContext, useState, useEffect, type ReactNode, type FC } from 'react';
import type { User, AuthContextType } from '@/types';
import { authClient } from '@/lib/auth-client'; 

// 1. The context is created with a default value of null.
export const AuthContext = createContext<AuthContextType | null>(null);

// 2. The custom hook is the new, crucial piece.
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // This check ensures that any component using this hook is a child of AuthProvider.
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const { data: session, isPending: isLoading, error } = authClient.useSession();

  if (error) {
    console.error("Error fetching session:", error);
  }

  // The user is now derived from the better-auth session.
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name
    // Add other user properties from the session as needed
  } : null;

  // The login function now uses authClient.signIn.email.
  const login = async (credentials: { email: string; password: string }) => {
    const { error } = await authClient.signIn.email(credentials);
    if (error) {
      console.error(error.message);
    }
    // The useSession hook will automatically update the session state upon successful login.
  };

  // The logout function now uses authClient.signOut.
  const logout = async () => {
    await authClient.signOut();
    // The useSession hook will automatically update the session state upon successful logout.
  };

  const isAuthenticated = !!user;

  // The value provided to the context now uses the state and functions from better-auth.
  const value: AuthContextType = { user, isAuthenticated, login, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
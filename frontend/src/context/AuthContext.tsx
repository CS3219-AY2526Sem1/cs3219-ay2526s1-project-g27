import { createContext, useContext, type ReactNode, type FC } from 'react';
import type { User, AuthContextType } from '@/types';
import { authClient } from '@/lib/auth-client'; 

export const AuthContext = createContext<AuthContextType | null>(null);


export const useAuth = (): AuthContextType => {
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
  // 1. Manage Session State
  const { data: session, isPending: isLoading, error: sessionError } = authClient.useSession();

  if (sessionError) {
    console.error("Error fetching session:", sessionError);
  }

  // 2. Map Session to User
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    username: session.user.name 
  } : null;

  const isAuthenticated = !!user;


  const login = async (credentials: { email: string; password: string }) => {
    const result = await authClient.signIn.email(credentials);
    if (result.error) {
      console.error("Login error:", result.error.message);
    }
    return result; 
  };

  const signup = async (credentials: { email: string; password: string; name: string }) => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL;

    const result = await authClient.signUp.email({
      email: credentials.email,
      password: credentials.password,
      name: credentials.name,
      callbackURL: frontendUrl, 
    });

    if (result.error) {
      console.error("Signup error:", result.error.message);
    }

    return result;
  };

  const logout = async () => {
    await authClient.signOut();
  };

  // 6. Provide Values
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signup, // Add signup to the provided value
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
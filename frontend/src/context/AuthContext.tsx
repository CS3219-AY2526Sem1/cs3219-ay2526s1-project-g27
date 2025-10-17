import { createContext, useContext,  useState, useEffect, type ReactNode, type FC } from 'react';
import type { User, AuthContextType } from '@/types';
import { authClient } from '@/lib/auth-client'; 
import { setAuthToken } from '@/api/apiClient';



export interface CustomAuthContextType extends AuthContextType {
  jwt: string | null;
  isLoading: boolean;        
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
  const { data: session, isPending: isLoading, error: sessionError } = authClient.useSession();

  if (sessionError) {
    console.error("Error fetching session:", sessionError);
  }

  useEffect(() => {
    if (session) {
      const token = (session as any).token ?? (session as any).session?.token ?? null;
      if (token) {
          setJwt(token);
          setAuthToken(token);
        } else {
          console.error("JWT not found on session object");
          setJwt(null);
          setAuthToken(null);
        }
    } else {
      setJwt(null);
      setAuthToken(null);
    }
  }, [session]);

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
    const frontendUrl = import.meta.env.FRONTEND_URL;

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
  const value: CustomAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    jwt, 
    login,
    logout,
    signup, // Add signup to the provided value
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
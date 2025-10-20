export interface User {
  id: string;
  email: string;
  username?: string; // username is optional
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: () => void;
  signup: (credentials: { email: string; password: string; name: string }) => Promise<any>;
}
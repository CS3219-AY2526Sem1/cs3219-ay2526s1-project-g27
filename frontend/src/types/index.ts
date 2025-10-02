export interface User {
  id: string;
  email: string;
  name?: string; // name is optional
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}
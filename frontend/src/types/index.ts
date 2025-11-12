export interface User {
  id: string;
  email: string;
  username?: string; // username is optional
}

export interface SolvedProblem {
  problemId: string;
  solvedAt: string;
  language: string;
}


export interface UserProfile {
  _id: string;
  userId: string;
  username?: string;
  handles: string[];
  problemsSolved: SolvedProblem[];
  biography: string;
  createdAt: string;
  updatedAt: string;
}


export type UpdateProfilePayload = {
  username?: string;
  biography?: string;
  handles?: string[];
  problemsSolved?: SolvedProblem[];
};

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: () => void;
  signup: (credentials: { email: string; password: string; name: string }) => Promise<any>;
}
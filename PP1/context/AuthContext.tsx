import { createContext, useContext, ReactNode, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (token: string) => void;
  logout: () => void;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (token: string) => {
    localStorage.setItem('accessToken', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
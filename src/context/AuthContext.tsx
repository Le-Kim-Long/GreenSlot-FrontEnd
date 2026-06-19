import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole, phone?: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await authApi.login({ username: email, password });
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        
        // Map backend roles to frontend roles roughly
        let role: UserRole = 'customer';
        if (data.roles?.includes('ROLE_ADMIN')) role = 'admin';
        else if (data.roles?.includes('ROLE_MANAGER')) role = 'staff';
        else if (data.roles?.includes('ROLE_FARMER')) role = 'owner';
        
        const loggedUser: User = {
          id: data.id?.toString(),
          name: data.fullName || data.username,
          email: data.email,
          role,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (name: string, email: string, password: string, role: UserRole, phone?: string): Promise<boolean> => {
    try {
      const data = await authApi.register({
        username: email,
        email: email,
        password: password,
        fullName: name,
        phone: phone || '',
        roles: [role === 'admin' ? 'admin' : role === 'owner' ? 'farmer' : role === 'staff' ? 'manager' : 'customer']
      });
      if (data) {
        // Automatically login after register, or just return true and let user login
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration failed", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

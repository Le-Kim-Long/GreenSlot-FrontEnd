import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { authApi } from '../api/authApi';
import { mapBackendRolesToFrontend } from '../utils/roleMap';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, name: string, email: string, password: string, phone?: string) => Promise<string | true>;
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await authApi.login({ username, password });
      if (data?.token) {
        localStorage.setItem('token', data.token);

        const role = mapBackendRolesToFrontend(data.roles) as UserRole;
        const loggedUser: User = {
          id: data.id?.toString(),
          name: data.fullName || data.username,
          email: data.email,
          role,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (username: string, name: string, email: string, password: string, phone?: string): Promise<string | true> => {
    try {
      await authApi.register({
        username,
        email,
        password,
        fullName: name,
        phone: phone || undefined,
      });
      return true;
    } catch (error: any) {
      console.error('Registration failed', error);
      const msg = error?.response?.data?.message || error?.response?.data;
      return typeof msg === 'string' ? msg : 'Đăng ký thất bại. Vui lòng thử lại.';
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

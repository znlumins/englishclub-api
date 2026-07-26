import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { UserDTO } from '../api/types';

interface RegisterPayload {
  full_name: string;
  nim: string;
  email: string;
  password: string;
  program_studi?: string;
  angkatan?: number;
  phone?: string;
}

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface AuthContextValue {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdminOrInstructor: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (patch: Partial<UserDTO>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): UserDTO | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as UserDTO) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<UserDTO | null>(() => readStoredUser());

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const res = await api.post<{ token: string; user: UserDTO }>('/auth/login', { email, password });
    if (!res.success) return { ok: false, message: res.error.message };
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return { ok: true };
  };

  const register = async (payload: RegisterPayload): Promise<AuthResult> => {
    const res = await api.post('/auth/register', payload);
    if (!res.success) return { ok: false, message: res.error.message };
    return { ok: true, message: res.message };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (patch: Partial<UserDTO>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isAdminOrInstructor: user?.role === 'admin' || user?.role === 'instructor',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | string;
  confirmed?: boolean;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  createdAt?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface AuthContextType {
  currentUser: User | null;
  userToken: string | null;
  adminToken: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isEditorMode: boolean;
  toggleEditorMode: () => void;
  login: (emailOrPhone: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  logout: () => void;
  getAdminHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('sm3d_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [userToken, setUserToken] = useState<string | null>(() => {
    return localStorage.getItem('sm3d_token') || null;
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('sm3d_admin_token') || null;
  });

  const [isEditorMode, setIsEditorMode] = useState<boolean>(() => {
    const val = localStorage.getItem('sm3d_editor_mode');
    return val === null ? true : val === 'true';
  });

  const toggleEditorMode = useCallback(() => {
    setIsEditorMode((prev) => {
      const next = !prev;
      localStorage.setItem('sm3d_editor_mode', String(next));
      return next;
    });
  }, []);

  const isLoggedIn = !!currentUser;
  const isAdmin = !!(currentUser && currentUser.role === 'admin' && adminToken);

  const getAdminHeaders = useCallback((): Record<string, string> => {
    const token = adminToken || localStorage.getItem('sm3d_admin_token') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'X-Admin-Token': token,
    };
  }, [adminToken]);

  const login = async (emailOrPhone: string, password: string): Promise<User> => {
    const res = await axios.post('/api/auth/login', {
      email: emailOrPhone.trim(),
      password,
    });
    const user: User = res.data.user;
    const token: string = res.data.token;

    setCurrentUser(user);
    setUserToken(token);
    localStorage.setItem('sm3d_user', JSON.stringify(user));
    localStorage.setItem('sm3d_token', token);
    return user;
  };

  const register = async (data: RegisterData): Promise<User> => {
    if (!data.password || data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long for security');
    }
    const cleanPhone = (data.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    await axios.post('/api/auth/register', data);
    return await login(data.email, data.password);
  };

  const adminLogin = async (email: string, password: string): Promise<User> => {
    const res = await axios.post('/api/auth/admin-login', {
      email: email.trim(),
      password,
    });
    const user: User = res.data.user;
    const admToken: string = res.data.adminToken;

    setCurrentUser(user);
    setAdminToken(admToken);
    localStorage.setItem('sm3d_user', JSON.stringify(user));
    localStorage.setItem('sm3d_admin_token', admToken);
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    setUserToken(null);
    setAdminToken(null);
    localStorage.removeItem('sm3d_user');
    localStorage.removeItem('sm3d_token');
    localStorage.removeItem('sm3d_admin_token');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userToken,
        adminToken,
        isLoggedIn,
        isAdmin,
        isEditorMode,
        toggleEditorMode,
        login,
        register,
        adminLogin,
        logout,
        getAdminHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

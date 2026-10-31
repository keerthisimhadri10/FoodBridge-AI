import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Organization, Notification, UserRole } from '../types';
import { api, getStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isLoading: boolean;
  unreadCount: number;
  notifications: Notification[];
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (accountType: 'donor' | 'ngo' | 'pending_ngo' | 'volunteer' | 'admin') => Promise<void>;
  register: (formData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      // Quiet fail for notifications
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.me();
      setUser(data.user);
      setOrganization(data.organization);
      setToken(currentToken);
      await refreshNotifications();
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      api.logout();
      setUser(null);
      setOrganization(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setOrganization(data.organization);
      setToken(data.token);
      await refreshNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (accountType: 'donor' | 'ngo' | 'pending_ngo' | 'volunteer' | 'admin') => {
    setIsLoading(true);
    try {
      const data = await api.quickLogin(accountType);
      setUser(data.user);
      setOrganization(data.organization);
      setToken(data.token);
      await refreshNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: any) => {
    setIsLoading(true);
    try {
      const data = await api.register(formData);
      setUser(data.user);
      setOrganization(data.organization);
      setToken(data.token);
      await refreshNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setOrganization(null);
    setToken(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isLoading,
        unreadCount,
        notifications,
        login,
        quickLogin,
        register,
        logout,
        refreshUser,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types/email';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: (credentialResponse?: any) => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
}

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'user-oliver-brown',
  name: 'Oliver Brown',
  email: 'oliver.brown@domain.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const stored = await api.getCurrentUser();
      if (stored) {
        setUser(stored);
      } else {
        // Automatically default to demo user Oliver Brown so user immediately sees Figma dashboard
        setUser(DEFAULT_DEMO_USER);
        await api.saveCurrentUser(DEFAULT_DEMO_USER);
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const loginWithGoogle = async (credentialResponse?: any) => {
    setIsLoading(true);
    try {
      if (credentialResponse?.access_token) {
        // Fetch userinfo from Google with access token
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credentialResponse.access_token}` },
        });
        const profile = await res.json();
        const googleUser: UserProfile = {
          id: profile.sub,
          name: profile.name || 'Google User',
          email: profile.email || 'user@gmail.com',
          avatarUrl: profile.picture || DEFAULT_DEMO_USER.avatarUrl,
        };
        setUser(googleUser);
        await api.saveCurrentUser(googleUser);
      } else {
        // Fallback to Oliver Brown
        setUser(DEFAULT_DEMO_USER);
        await api.saveCurrentUser(DEFAULT_DEMO_USER);
      }
    } catch (e) {
      console.error('Google login error, falling back to demo user', e);
      setUser(DEFAULT_DEMO_USER);
      await api.saveCurrentUser(DEFAULT_DEMO_USER);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string) => {
    setIsLoading(true);
    const customUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0] || 'User',
      email: email,
      avatarUrl: DEFAULT_DEMO_USER.avatarUrl,
    };
    setUser(customUser);
    await api.saveCurrentUser(customUser);
    setIsLoading(false);
  };

  const loginAsDemo = async () => {
    setIsLoading(true);
    setUser(DEFAULT_DEMO_USER);
    await api.saveCurrentUser(DEFAULT_DEMO_USER);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    api.clearCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: DEFAULT_DEMO_USER,
      isLoading: false,
      loginWithGoogle: async () => {},
      loginWithEmail: async () => {},
      loginAsDemo: async () => {},
      logout: () => {},
    };
  }
  return context;
};

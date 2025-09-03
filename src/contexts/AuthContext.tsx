import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { MockAuthService } from '../services/mockAuth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasApiCredentials: boolean;
  isAppAuthenticated: boolean;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  clearAppAuthentication: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiCredentials, setHasApiCredentials] = useState(false);
  const [isAppAuthenticated, setIsAppAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session on app load
    const savedUser = localStorage.getItem('flattrade_user');
    const savedApiCredentials = localStorage.getItem('flattrade_api_credentials');
    const savedAppAuth = localStorage.getItem('flattrade_app_auth');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // If user has API credentials, they're fully authenticated
        if (savedApiCredentials) {
          setHasApiCredentials(true);
        }
        
        // If user has app auth, they're authenticated
        if (savedAppAuth) {
          setIsAppAuthenticated(true);
        }
        
        // For Google OAuth users, ensure they have API credentials for dashboard access
        if (parsedUser.apiKey && parsedUser.apiKey === 'demo_api_key') {
          setHasApiCredentials(true);
        }
      } catch (error) {
        localStorage.removeItem('flattrade_user');
        localStorage.removeItem('flattrade_token');
        localStorage.removeItem('flattrade_api_credentials');
        localStorage.removeItem('flattrade_app_auth');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Handle Google OAuth authentication
  const loginWithGoogle = async (): Promise<boolean> => {
    console.log('🔐 Starting Google OAuth authentication...');
    setIsLoading(true);
    
    try {
      const authResponse = await MockAuthService.signInWithGoogle();

      if (authResponse.success && authResponse.user) {
        // Store app authentication
        const appUser: User = {
          id: authResponse.user.id,
          username: authResponse.user.displayName || authResponse.user.email.split('@')[0],
          email: authResponse.user.email,
          role: 'manager',
          isActive: true,
          createdAt: new Date(),
        };
        
        setUser(appUser);
        setIsAppAuthenticated(true);
        setHasApiCredentials(false);
        
        // Store user data
        localStorage.setItem('borewell_user', JSON.stringify(appUser));
        localStorage.setItem('borewell_app_auth', 'true');
        
        toast.success('Welcome! You are now logged in with Google.');
        console.log('✅ Google OAuth completed, direct dashboard access');
        return true;
      } else {
        throw new Error(authResponse.error || 'Authentication failed');
      }
      
    } catch (error: any) {
      console.log('❌ Google OAuth authentication failed:', error);
      toast.error(error.message || 'Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };



  const logout = async () => {
    setUser(null);
    setHasApiCredentials(false);
    setIsAppAuthenticated(false);
    localStorage.removeItem('borewell_user');
    localStorage.removeItem('borewell_app_auth');
    
    // Sign out from mock service
    await MockAuthService.signOut();
    
    toast.success('Logged out successfully');
  };



  const clearAppAuthentication = () => {
    setIsAppAuthenticated(false);
    setUser(null);
    localStorage.removeItem('borewell_user');
    localStorage.removeItem('borewell_app_auth');
    toast.success('App authentication cleared');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasApiCredentials,
    isAppAuthenticated,
    loginWithGoogle,
    logout,
    clearAppAuthentication,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService from '@/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Retrieve auth token on initial hydration
    const storedUser = localStorage.getItem('crdms_user');
    const storedToken = localStorage.getItem('crdms_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Protect pages based on roles & authentication
  useEffect(() => {
    if (loading) return;

    const publicPages = ['/login'];
    const isPublicPage = publicPages.includes(pathname);

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && isPublicPage) {
      router.push('/');
    } else if (user) {
      // Role restrictions mapping permissions to specific path scopes
      const role = user.role;
      if (pathname.startsWith('/admin') && !['Admin'].includes(role)) {
        router.push('/');
      }
      if (pathname.startsWith('/reports') && !['Admin', 'HR Manager', 'Recruiter'].includes(role)) {
        router.push('/');
      }
      if (pathname.startsWith('/candidates/new') && !['Admin', 'HR Manager', 'Recruiter', 'Data Entry'].includes(role)) {
        router.push('/');
      }
    }
  }, [user, pathname, loading, router]);

  const login = async (email, password) => {
    try {
      const res = await authService.login(email, password);
      
      const userPayload = res.data.user;
      const accessToken = res.data.accessToken;

      localStorage.setItem('crdms_user', JSON.stringify(userPayload));
      localStorage.setItem('crdms_token', accessToken);

      setUser(userPayload);
      setToken(accessToken);
      router.push('/');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Gracefully continue clearing storage on network failure
    }
    
    localStorage.removeItem('crdms_user');
    localStorage.removeItem('crdms_token');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const hasRole = (allowedRoles) => {
    return user && allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
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
export default AuthContext;

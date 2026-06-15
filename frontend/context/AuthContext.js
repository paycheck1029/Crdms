'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_URL } from '@/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load auth token on initial hydration
    const storedUser = localStorage.getItem('crdms_user');
    const storedToken = localStorage.getItem('crdms_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Protect pages based on auth and roles
  useEffect(() => {
    if (loading) return;

    const publicPages = ['/login'];
    const isPublicPage = publicPages.includes(pathname);

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && isPublicPage) {
      router.push('/');
    } else if (user) {
      // Role restrictions matching BRD
      // Admin: Access to everything
      // IT Team: Access to logs and dashboard only (admin/logs page)
      // Management: Access to reports and view candidates (no new candidate creation)
      // Recruitment Team: Access to candidate CRUD and search (no reports/admin panel)
      
      const role = user.role;
      if (pathname.startsWith('/admin') && !['Admin', 'IT Team'].includes(role)) {
        router.push('/');
      }
      if (pathname.startsWith('/reports') && !['Admin', 'Management'].includes(role)) {
        router.push('/');
      }
      if (pathname.startsWith('/candidates/new') && !['Admin', 'Recruitment Team'].includes(role)) {
        router.push('/');
      }
    }
  }, [user, pathname, loading, router]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      localStorage.setItem('crdms_user', JSON.stringify(data.user));
      localStorage.setItem('crdms_token', data.token);

      setUser(data.user);
      setToken(data.token);
      router.push('/');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
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

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: '#070a13',
        color: '#f8fafc',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(255, 255, 255, 0.05)',
          borderTop: '3px solid #06b6d4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', letterSpacing: '0.05em' }}>
          LOADING CRDMS...
        </p>
      </div>
    );
  }

  const isLoginPage = pathname === '/login';

  // If user is authenticated and not on login page, show layout with sidebar
  if (user && !isLoginPage) {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    );
  }

  // Otherwise (e.g. login page or unauthenticated state redirecting)
  return <>{children}</>;
}

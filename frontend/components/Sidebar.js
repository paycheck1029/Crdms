'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  ShieldAlert, 
  LogOut,
  Zap
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  if (!user) return null;

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard size={20} />,
      roles: ['Admin', 'Recruitment Team', 'Management', 'IT Team']
    },
    {
      name: 'Candidates',
      path: '/candidates',
      icon: <Users size={20} />,
      roles: ['Admin', 'Recruitment Team', 'Management', 'IT Team']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChart3 size={20} />,
      roles: ['Admin', 'Management']
    },
    {
      name: 'Admin Panel',
      path: '/admin',
      icon: <ShieldAlert size={20} />,
      roles: ['Admin', 'IT Team']
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Zap size={18} />
        <span>Recruit Pro</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const hasPermission = !item.roles || hasRole(item.roles);
            if (!hasPermission) return null;

            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));

            return (
              <li key={item.name}>
                <Link 
                  href={item.path} 
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(13, 124, 193, 0.25)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          fontWeight: '700'
        }}>
          {user.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sidebar-username" title={user.username} style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {user.username}
          </div>
          <div className="sidebar-role" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {user.role}
          </div>
        </div>
        <button onClick={logout} className="logout-btn" title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

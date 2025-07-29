import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PageNavigation() {
  const location = useLocation();
  
  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/performance', label: 'Performance', icon: '📈' },
    { path: '/users', label: 'Users', icon: '👥' },
  ];

  return (
    <nav className="mb-6">
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              location.pathname === item.path
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-primary hover:bg-background/50'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Brain,
  Settings,
  HelpCircle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navigation = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    title: 'Users',
    icon: Users,
    href: '/users',
  },
  {
    title: 'Teams',
    icon: Users,
    href: '/teams',
  },
  {
    title: 'Agents',
    icon: Zap,
    href: '/agents',
  },
  {
    title: 'Models',
    icon: Brain,
    href: '/models',
  },
];

const rightNavigation = [
  {
    title: 'Settings',
    icon: Settings,
    href: '/settings',
  },
  {
    title: 'Help',
    icon: HelpCircle,
    href: '/help',
  },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen w-full">

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
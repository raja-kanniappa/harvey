import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home,
  Users,
  Brain,
  BarChart3,
  Settings,
  Menu
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ currentPage, collapsed, onToggleCollapse }: SidebarProps) {
  const navigationItems = [
    {
      id: 'dashboard',
      href: '/',
      icon: Home,
      title: 'Dashboard',
      description: 'Overview'
    },
    {
      id: 'agents',
      href: '/agents',
      icon: Brain,
      title: 'Agents',
      description: 'AI Agents'
    },
    {
      id: 'teams',
      href: '/teams',
      icon: Users,
      title: 'Teams',
      description: 'Team Analytics'
    },
    {
      id: 'users',
      href: '/users',
      icon: Users,
      title: 'Users',
      description: 'User Analytics'
    },
    {
      id: 'models',
      href: '/models',
      icon: BarChart3,
      title: 'Models',
      description: 'AI Models'
    }
  ];

  return (
    <div className={`bg-white/80 backdrop-blur-sm border-r border-gray-200/50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'} flex flex-col`}>
      {/* Sidebar Header */}
      <div className={`h-20 flex items-center justify-between border-b border-gray-200/50 ${collapsed ? 'px-2' : 'px-6'}`}>
        {!collapsed && (
          <div className="space-y-1">
            <h1 className="text-xl font-light text-gray-900">Harvey</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">ANALYTICS</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-6'}`}>
        <div className="space-y-8">
          {/* Main Navigation Items */}
          <div className="space-y-3">
            {!collapsed && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                Navigation
              </h3>
            )}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <a 
                  key={item.id}
                  href={item.href} 
                  className={`group flex items-center gap-4 rounded-xl cursor-pointer transition-all duration-200 ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'} ${
                    isActive 
                      ? 'bg-blue-100 text-blue-800 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {!collapsed && (
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${
                        isActive ? 'text-blue-800' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>{item.title}</div>
                      <div className={`text-xs ${isActive ? 'text-blue-600 opacity-80' : 'text-gray-500'}`}>
                        {isActive ? 'Current Page' : item.description}
                      </div>
                    </div>
                  )}
                </a>
              );
            })}

          </div>
          
          {/* Settings Section */}
          <div className="space-y-3">
            {!collapsed && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                Settings
              </h3>
            )}
            <div className={`group flex items-center gap-4 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-all duration-200 ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}`}>
              <Settings className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
              {!collapsed && (
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">Settings</div>
                  <div className="text-xs text-gray-500">Configuration</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="p-6 border-t border-gray-200/50">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Environment</span>
            </div>
            <div className="text-sm font-medium text-gray-900">UAT Testing</div>
            <div className="text-xs text-gray-500">Development mode</div>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, BarChart3 } from 'lucide-react';

interface HeaderProps {
  showLogout?: boolean;
  onLogout?: () => void;
  title?: string;
  subtitle?: string;
  showDashboard?: boolean;
  onDashboardClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  showLogout = true, 
  onLogout, 
  title = "MyAzaan",
  subtitle,
  showDashboard = false,
  onDashboardClick
}) => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-amber-200/50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/myazaan.png" 
              alt="MyAzaan Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-amber-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-amber-600">{subtitle}</p>
              )}
              {currentUser && !subtitle && (
                <p className="text-sm text-amber-600">Welcome, {currentUser.email}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {showDashboard && onDashboardClick && (
            <button
              onClick={onDashboardClick}
              className="flex items-center space-x-2 text-amber-700 hover:text-amber-900 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          )}
          
          {showLogout && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-amber-700 hover:text-amber-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header; 
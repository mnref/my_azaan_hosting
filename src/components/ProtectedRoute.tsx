import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  console.log('🛡️ ProtectedRoute rendering...');
  
  const { currentUser } = useAuth();
  
  console.log('🛡️ ProtectedRoute - currentUser:', !!currentUser);
  
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

export default ProtectedRoute;
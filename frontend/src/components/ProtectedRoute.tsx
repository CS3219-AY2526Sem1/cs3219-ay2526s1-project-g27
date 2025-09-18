// src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to the login page if not authenticated
      navigate('/login', { replace: true }); // `replace: true` prevents going back to the protected route
    }
  }, [isAuthenticated, navigate]);
  

  // Only render children if authenticated, otherwise the effect will navigate away
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
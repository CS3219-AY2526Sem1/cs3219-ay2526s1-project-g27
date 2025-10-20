// /routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; // or your <FullScreenSpinner />
  }

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />;
};

export default ProtectedRoute;



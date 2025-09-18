import { type FC, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import NotFound from '@/pages/NotFound';

// Lazily import all your pages
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/auth/Login'));
// const Dashboard = lazy(() => import('@/pages/Dashboard'));
// const NotFound = lazy(() => import('@/pages/NotFound'));
// Add other pages as you create them
// const Register = lazy(() => import('@/pages/Register'));
// const Features = lazy(() => import('@/pages/Features'));

// Create placeholder pages so the imports don't fail
// e.g., src/pages/Login.tsx => export default function Login() { return <div>Login Page</div>; }

const AppRouter: FC = () => {
  return (
    // The Suspense fallback will be shown while the lazy-loaded component is fetched
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
        {/* <Route path="/features" element={<Features />} /> */}

        {/* Protected Routes
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route> */}
        
        {/* 404 Handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
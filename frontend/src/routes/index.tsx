import { type FC } from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from '@/pages/Home';
import ProfilePage from '@/pages/Profile';
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/routes/ProtectedRoute';
import MatchingPage from '@/pages/matching/Match';
import CollaborationPage from '@/pages/collab/Session';

const AppRouter: FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* <Route path="/features" element={<Features />} /> */}

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/match" element={<MatchingPage />} />
        <Route path="/collab" element={<CollaborationPage/>} />
        <Route path="/chat" />
      </Route>
      
      {/* 404 Handler */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
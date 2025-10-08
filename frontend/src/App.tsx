import { type FC } from 'react';
import AppRouter from '@/routes';
import { BrowserRouter } from 'react-router-dom'; 
import { AuthProvider } from '@/context/AuthContext.tsx';
import NavBar from '@/components/NavBar.tsx';
import ErrorBoundary from '@/components/error-boundary.tsx'; // Recommended for production

const App: FC = () => {
  return (
    <BrowserRouter> 
      <AuthProvider>
        <ErrorBoundary>
          <NavBar />
          <AppRouter />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
/*
AI Assistance Disclosure:
Tool: Claude 4.5 
Scope: 
- Generated initial boiler plate UI
- Debugging 
Author review: 
- Verfied for correctness by reading code
- Tested using local 
*/

import { type FC } from 'react';
import AppRouter from '@/routes';
import { BrowserRouter } from 'react-router-dom'; 
import { AuthProvider } from '@/context/AuthContext.tsx';
import NavBar from '@/components/common/NavBar';
import ErrorBoundary from '@/components/ErrorBoundary'; // Recommended for production
import { MatchingProvider } from './context/MatchContext';

const App: FC = () => {
  return (
    <BrowserRouter> 
      <AuthProvider>
        <MatchingProvider>
            <ErrorBoundary>
              <NavBar />
              <AppRouter />
            </ErrorBoundary>
        </MatchingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
import { type FC } from 'react';
import AppRouter from '@/routes';
import ErrorBoundary from '@/components/ErrorBoundary'; // Recommended for production

const App: FC = () => {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;
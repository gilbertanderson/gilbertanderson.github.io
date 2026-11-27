import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import App from './App';
import { ApiError } from '@/lib/api';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider, showGlobalToast } from '@/components/atoms/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CHANGE_EVENT } from '@/lib/demo/store';
import { startNeighborClock } from '@/lib/demo/neighbors';
import './styles/global.css';
import { registerAppServiceWorker } from '@/lib/serviceWorker';

if (localStorage.getItem('sc_view_mode') === 'frame') {
  document.documentElement.classList.add('framed');
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) return;
      showGlobalToast(error instanceof Error ? error.message : 'Something went wrong');
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// When the in-browser backend changes (a neighbor replied, another tab wrote),
// refresh whatever is on screen. This stands in for polling a real API.
window.addEventListener(CHANGE_EVENT, () => {
  void queryClient.invalidateQueries();
});
startNeighborClock();

// GitHub Pages serves static files only, so routes live after the # and
// /share-crops/#/marketplace survives a reload without a server rewrite.
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HashRouter>
  </ErrorBoundary>
);

registerAppServiceWorker();

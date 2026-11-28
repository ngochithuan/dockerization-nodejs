import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-500.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-700.css';
import '@fontsource/be-vietnam-pro/vietnamese-800.css';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/latin-500.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/latin-700.css';
import '@fontsource/be-vietnam-pro/latin-800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';

import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, err) => (err?.status >= 400 && err?.status < 500 ? false : count < 2),
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-lg)',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

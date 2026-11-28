import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';

// Route-level code splitting: each page is its own chunk.
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

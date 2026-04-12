import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { BooksPage } from './pages/BooksPage';
import { EditorPage } from './pages/EditorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'books', element: <BooksPage /> },
      { path: 'editor/:bookId', element: <EditorPage /> },
    ],
  },
]);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

import { theme } from './theme';
import { AppProvider } from './state/AppContext';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AppShellLayout } from './layout/AppShellLayout';
import {
  RequireAdmin,
  RequireOnboarded,
  RequireRole,
} from './routes/guards';
import { ChildrenPage } from './pages/ChildrenPage';
import { WishesPage } from './pages/WishesPage';
import { ActivityTypesPage } from './pages/ActivityTypesPage';
import { MorePage } from './pages/MorePage';
import { MyStarsPage } from './pages/MyStarsPage';
import { AdminPage } from './pages/AdminPage';
import { useApp } from './state/AppContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/app"
        element={
          <RequireOnboarded>
            <AppShellLayout />
          </RequireOnboarded>
        }
      >
        <Route index element={<RoleHomeRedirect />} />
        <Route
          path="children"
          element={
            <RequireRole role="parent">
              <ChildrenPage />
            </RequireRole>
          }
        />
        <Route
          path="activities"
          element={
            <RequireRole role="parent">
              <ActivityTypesPage />
            </RequireRole>
          }
        />
        <Route
          path="stars"
          element={
            <RequireRole role="child">
              <MyStarsPage />
            </RequireRole>
          }
        />
        <Route path="wishes" element={<WishesPage />} />
        <Route path="more" element={<MorePage />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

function RoleHomeRedirect() {
  const { state } = useApp();
  if (state.role === 'parent') return <Navigate to="/app/children" replace />;
  if (state.role === 'child') return <Navigate to="/app/stars" replace />;
  return <Navigate to="/onboarding" replace />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <Notifications position="top-center" />
        <BrowserRouter>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline / dev */
    });
  });
}

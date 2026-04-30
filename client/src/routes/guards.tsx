import { Center, Loader } from '@mantine/core';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '../state/AppContext';
import type { UserRole } from '../types';
import type { ReactNode } from 'react';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();
  const location = useLocation();
  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { isAuthenticated, isOnboarded, isLoading } = useApp();
  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { state } = useApp();
  if (state.role !== role) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { state } = useApp();
  if (!state.isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <Center mih="100dvh">
      <Loader size="lg" />
    </Center>
  );
}

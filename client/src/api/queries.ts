/**
 * TanStack Query keys + read hooks. Hooks vrací standardní `useQuery` výsledek.
 * Hooks musí být volány až za autorizovaným kontextem (v rámci /app routes).
 */
import { useQuery } from '@tanstack/react-query';
import { apiFetch, HttpError } from './client';
import type {
  ActivityType,
  Child,
  ChildInvitation,
  Family,
  MeResponse,
  Transaction,
  Wish,
} from '../types';

export const qk = {
  me: ['me'] as const,
  family: ['family'] as const,
  children: ['children'] as const,
  transactions: (childId: number) => ['transactions', childId] as const,
  myTransactions: ['transactions', 'mine'] as const,
  wishes: ['wishes'] as const,
  fulfilledWishes: (childId: number) => ['wishes', 'fulfilled', childId] as const,
  activityTypes: ['activity-types'] as const,
  childInvitations: ['child-invitations'] as const,
  adminUsers: ['admin', 'users'] as const,
  adminFamilies: ['admin', 'families'] as const,
  adminInvitations: ['admin', 'child-invitations'] as const,
};

const defaultRetry = (failureCount: number, error: unknown) => {
  if (error instanceof HttpError && [401, 403, 404].includes(error.status)) {
    return false;
  }
  return failureCount < 1;
};

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => apiFetch<MeResponse>('/api/auth/me'),
    staleTime: 60_000,
    retry: defaultRetry,
  });
}

export function useFamily(enabled: boolean) {
  return useQuery({
    queryKey: qk.family,
    queryFn: () => apiFetch<{ family: Family }>('/api/families/mine').then((r) => r.family),
    enabled,
    staleTime: 5 * 60_000,
    retry: defaultRetry,
  });
}

export function useChildren(enabled: boolean) {
  return useQuery({
    queryKey: qk.children,
    queryFn: () => apiFetch<{ children: Child[] }>('/api/children').then((r) => r.children),
    enabled,
    staleTime: 30_000,
    retry: defaultRetry,
  });
}

export function useTransactions(childId: number | null) {
  return useQuery({
    queryKey: childId ? qk.transactions(childId) : qk.myTransactions,
    queryFn: () => {
      const path = childId
        ? `/api/transactions?childId=${childId}`
        : '/api/transactions';
      return apiFetch<{ transactions: Transaction[] }>(path).then(
        (r) => r.transactions,
      );
    },
    staleTime: 15_000,
    retry: defaultRetry,
  });
}

export interface WishesResponse {
  wishes: (Wish & { reachable?: boolean | null })[];
  balance?: number;
}

export function useWishes() {
  return useQuery({
    queryKey: qk.wishes,
    queryFn: () => apiFetch<WishesResponse>('/api/wishes'),
    staleTime: 30_000,
    retry: defaultRetry,
  });
}

export function useFulfilledWishes(childId: number) {
  return useQuery({
    queryKey: qk.fulfilledWishes(childId),
    queryFn: () =>
      apiFetch<{ wishes: Wish[] }>(`/api/wishes/fulfilled?childId=${childId}`).then(
        (r) => r.wishes,
      ),
    staleTime: 60_000,
    retry: defaultRetry,
  });
}

export function useActivityTypes(enabled: boolean) {
  return useQuery({
    queryKey: qk.activityTypes,
    queryFn: () =>
      apiFetch<{ activityTypes: ActivityType[] }>('/api/activity-types').then(
        (r) => r.activityTypes,
      ),
    enabled,
    staleTime: 5 * 60_000,
    retry: defaultRetry,
  });
}

export function useChildInvitations(enabled: boolean) {
  return useQuery({
    queryKey: qk.childInvitations,
    queryFn: () =>
      apiFetch<{ invitations: ChildInvitation[] }>('/api/child-invitations').then(
        (r) => r.invitations,
      ),
    enabled,
    staleTime: 30_000,
    retry: defaultRetry,
  });
}

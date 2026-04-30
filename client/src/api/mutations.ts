/**
 * TanStack Query mutation hooks. Žádné optimistic updates ani offline mutations.
 * Při OfflineError → komponenta zobrazí <OfflineGate>.
 *
 * Per-call callbacks (např. `mutate(vars, { onSuccess })`) jsou vyvolány vedle
 * hook-level callbacks, takže invalidace + notifikace fungují vždy.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch, isOfflineError, HttpError } from './client';
import { qk } from './queries';
import type {
  ActivityType,
  ChildInvitation,
  Family,
  Transaction,
  Wish,
} from '../types';

function notifyError(err: unknown, fallback = 'Něco se nepovedlo') {
  if (isOfflineError(err)) {
    notifications.show({
      color: 'yellow',
      title: 'Jste offline',
      message: 'Tato akce vyžaduje připojení k internetu.',
    });
    return;
  }
  const message =
    err instanceof HttpError ? err.message : err instanceof Error ? err.message : fallback;
  notifications.show({ color: 'red', title: 'Chyba', message });
}

function notifySuccess(message: string) {
  notifications.show({ color: 'teal', message });
}

// ---------- Families / onboarding ----------

export function useCreateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) =>
      apiFetch<{ family: Family }>('/api/families', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.family });
      notifySuccess('Rodina vytvořena');
    },
    onError: (err) => notifyError(err),
  });
}

export function useJoinFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code }: { code: string }) =>
      apiFetch<{ family: Family }>('/api/families/join', {
        method: 'POST',
        body: JSON.stringify({ code: code.toUpperCase() }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.family });
      notifySuccess('Připojeno k rodině');
    },
    onError: (err) => notifyError(err),
  });
}

export function useRegisterChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code }: { code: string }) =>
      apiFetch<{ familyId: number }>('/api/children/register', {
        method: 'POST',
        body: JSON.stringify({ code: code.toUpperCase() }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.family });
      notifySuccess('Připojeno k rodině');
    },
    onError: (err) => notifyError(err),
  });
}

// ---------- Logout ----------

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.clear();
      window.location.href = '/login';
    },
    onError: (err) => notifyError(err),
  });
}

// ---------- Child invitations ----------

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ invitation: ChildInvitation }>('/api/child-invitations', {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.childInvitations });
      notifySuccess('Klíč vygenerován');
    },
    onError: (err) => notifyError(err),
  });
}

export function useDeleteInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/child-invitations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.childInvitations });
    },
    onError: (err) => notifyError(err),
  });
}

export function useDeleteChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/children/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.children });
      notifySuccess('Dítě odebráno');
    },
    onError: (err) => notifyError(err),
  });
}

// ---------- Transactions ----------

export interface CreateTransactionVars {
  childId: number;
  amount: number;
  description: string;
  categoryId?: number;
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: CreateTransactionVars) =>
      apiFetch<{ transaction: Transaction }>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.children });
      qc.invalidateQueries({ queryKey: qk.transactions(vars.childId) });
      qc.invalidateQueries({ queryKey: qk.wishes });
      notifySuccess(vars.amount >= 0 ? 'Hvězdy přidány' : 'Hvězdy odebrány');
    },
    onError: (err) => notifyError(err),
  });
}

// ---------- Wishes ----------

export interface CreateWishVars {
  title: string;
  starCost?: number;
  isPersistent?: boolean;
}

export function useCreateWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: CreateWishVars) =>
      apiFetch<{ wish: Wish }>('/api/wishes', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.wishes });
      notifySuccess('Přání přidáno');
    },
    onError: (err) => notifyError(err),
  });
}

export interface UpdateWishVars {
  id: number;
  title?: string;
  starCost?: number;
  isPersistent?: boolean;
}

export function useUpdateWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateWishVars) =>
      apiFetch<{ wish: Wish }>(`/api/wishes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.wishes });
      notifySuccess('Přání upraveno');
    },
    onError: (err) => notifyError(err),
  });
}

export function useDeleteWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/wishes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.wishes });
    },
    onError: (err) => notifyError(err),
  });
}

export function useFulfillWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, childId }: { id: number; childId: number }) =>
      apiFetch(`/api/wishes/${id}/fulfill`, {
        method: 'POST',
        body: JSON.stringify({ childId }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.wishes });
      qc.invalidateQueries({ queryKey: qk.children });
      qc.invalidateQueries({ queryKey: qk.transactions(vars.childId) });
      qc.invalidateQueries({ queryKey: qk.fulfilledWishes(vars.childId) });
      notifySuccess('Přání splněno');
    },
    onError: (err) => notifyError(err),
  });
}

// ---------- Activity types ----------

export function useCreateActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; defaultStars: number }) =>
      apiFetch<{ activityType: ActivityType }>('/api/activity-types', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.activityTypes });
    },
    onError: (err) => notifyError(err),
  });
}

export function useUpdateActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; name?: string; defaultStars?: number }) =>
      apiFetch<{ activityType: ActivityType }>(`/api/activity-types/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.activityTypes });
    },
    onError: (err) => notifyError(err),
  });
}

export function useDeleteActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/activity-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.activityTypes });
    },
    onError: (err) => notifyError(err),
  });
}

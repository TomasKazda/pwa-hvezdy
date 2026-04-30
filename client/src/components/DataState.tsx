import { Alert, Skeleton, Stack } from '@mantine/core';
import { IconAlertCircle, IconWifiOff } from '@tabler/icons-react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { HttpError } from '../api/client';

interface DataStateProps<T> {
  query: UseQueryResult<T, unknown>;
  /** Render při úspěchu */
  children: (data: T) => ReactNode;
  /** Skeleton placeholder. Default: 3 řádky. */
  skeleton?: ReactNode;
  /** Vlastní empty render (volitelně). */
  emptyWhen?: (data: T) => boolean;
  empty?: ReactNode;
}

const defaultSkeleton = (
  <Stack gap="sm" p="md">
    <Skeleton h={60} radius="md" />
    <Skeleton h={60} radius="md" />
    <Skeleton h={60} radius="md" />
  </Stack>
);

export function DataState<T>({
  query,
  children,
  skeleton,
  emptyWhen,
  empty,
}: DataStateProps<T>) {
  if (query.isPending) return <>{skeleton ?? defaultSkeleton}</>;

  if (query.isError) {
    const err = query.error;
    const isOffline =
      err instanceof HttpError && err.status === 503;
    if (isOffline) {
      return (
        <Alert
          m="md"
          color="yellow"
          icon={<IconWifiOff size={18} />}
          title="Offline"
        >
          Data nejsou k dispozici v offline cache. Připojte se a zkuste znovu.
        </Alert>
      );
    }
    const message = err instanceof Error ? err.message : 'Neznámá chyba';
    return (
      <Alert m="md" color="red" icon={<IconAlertCircle size={18} />} title="Chyba">
        {message}
      </Alert>
    );
  }

  if (emptyWhen && emptyWhen(query.data)) return <>{empty ?? null}</>;
  return <>{children(query.data)}</>;
}

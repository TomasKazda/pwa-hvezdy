import { Alert } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useOnlineStatus } from '../state/AppContext';

/**
 * Schová zápisové UI v offline a místo něj zobrazí vysvětlení.
 */
export function OfflineGate({
  children,
  message = 'Tato akce vyžaduje připojení k internetu.',
}: {
  children: ReactNode;
  message?: string;
}) {
  const online = useOnlineStatus();
  if (!online) {
    return (
      <Alert
        color="yellow"
        icon={<IconWifiOff size={18} />}
        title="Jste offline"
        m="md"
      >
        {message}
      </Alert>
    );
  }
  return <>{children}</>;
}

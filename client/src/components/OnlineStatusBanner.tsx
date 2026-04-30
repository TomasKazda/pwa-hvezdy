import { Transition, Paper, Group, Text } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';
import { useOnlineStatus } from '../state/AppContext';

export function OnlineStatusBanner() {
  const online = useOnlineStatus();
  return (
    <Transition mounted={!online} transition="slide-down" duration={200}>
      {(styles) => (
        <Paper
          shadow="sm"
          radius={0}
          p="xs"
          bg="yellow.1"
          style={{
            ...styles,
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Group gap="xs" justify="center" wrap="nowrap">
            <IconWifiOff size={16} />
            <Text fz="sm" fw={500} c="yellow.9">
              Jste offline – některé akce nejsou dostupné
            </Text>
          </Group>
        </Paper>
      )}
    </Transition>
  );
}

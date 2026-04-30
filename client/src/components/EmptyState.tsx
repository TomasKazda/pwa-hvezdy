import { Center, Stack, Text, ThemeIcon } from '@mantine/core';
import type { ComponentType, ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<{ size?: number }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Center py="xl" px="md" mih={200}>
      <Stack align="center" gap="sm">
        {Icon && (
          <ThemeIcon size={64} radius="xl" variant="light" color="grape">
            <Icon size={32} />
          </ThemeIcon>
        )}
        <Text fw={600} fz="lg" ta="center">
          {title}
        </Text>
        {description && (
          <Text c="dimmed" ta="center" fz="sm" maw={280}>
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Center>
  );
}

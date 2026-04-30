import { Group, Text, ThemeIcon } from '@mantine/core';
import { IconStarFilled } from '@tabler/icons-react';

interface StarBalanceProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: { fz: 14, icon: 14, themeSize: 'sm' as const },
  md: { fz: 18, icon: 18, themeSize: 'md' as const },
  lg: { fz: 28, icon: 24, themeSize: 'lg' as const },
  xl: { fz: 56, icon: 44, themeSize: 'xl' as const },
};

export function StarBalance({ amount, size = 'md' }: StarBalanceProps) {
  const cfg = sizeMap[size];
  return (
    <Group gap={6} wrap="nowrap" align="center">
      <ThemeIcon
        size={cfg.themeSize}
        variant="light"
        color="yellow"
        radius="xl"
      >
        <IconStarFilled size={cfg.icon} />
      </ThemeIcon>
      <Text fw={700} fz={cfg.fz} lh={1}>
        {amount}
      </Text>
    </Group>
  );
}

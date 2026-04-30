import { ActionIcon, Group, Paper, Stack, Text, useMantineTheme } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import classes from './BottomTabs.module.css';

export interface TabItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
}

export function BottomTabs({ items }: { items: TabItem[] }) {
  const location = useLocation();
  const theme = useMantineTheme();

  return (
    <Paper
      shadow="md"
      radius={0}
      withBorder
      className={classes.bar}
      bg="var(--mantine-color-body)"
    >
      <Group gap={0} grow wrap="nowrap" h="100%">
        {items.map((item) => {
          const active =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + '/');
          return (
            <Link
              key={item.to}
              to={item.to}
              className={classes.tab}
              data-active={active || undefined}
            >
              <Stack gap={2} align="center" justify="center" h="100%">
                <ActionIcon
                  variant="transparent"
                  color={active ? 'grape' : 'gray'}
                  size="lg"
                  aria-label={item.label}
                  component="span"
                >
                  <item.icon size={24} stroke={active ? 2.2 : 1.8} />
                </ActionIcon>
                <Text
                  fz={11}
                  fw={active ? 600 : 500}
                  c={active ? theme.primaryColor : 'dimmed'}
                  lh={1}
                >
                  {item.label}
                </Text>
              </Stack>
            </Link>
          );
        })}
      </Group>
    </Paper>
  );
}

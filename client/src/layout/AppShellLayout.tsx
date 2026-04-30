import {
  ActionIcon,
  AppShell,
  Avatar,
  Group,
  Menu,
  Text,
  Title,
} from '@mantine/core';
import {
  IconActivity,
  IconChevronDown,
  IconCrown,
  IconGift,
  IconLogout,
  IconStarFilled,
  IconUser,
  IconUsers,
  IconDots,
} from '@tabler/icons-react';
import { Outlet, useNavigate } from 'react-router';
import { useApp } from '../state/AppContext';
import { useLogout } from '../api/mutations';
import { useChildren } from '../api/queries';
import { BottomTabs, type TabItem } from '../components/BottomTabs';
import { OnlineStatusBanner } from '../components/OnlineStatusBanner';
import classes from './AppShellLayout.module.css';

const PARENT_TABS: TabItem[] = [
  { to: '/app/children', label: 'Děti', icon: IconUsers },
  { to: '/app/wishes', label: 'Přání', icon: IconGift },
  { to: '/app/activities', label: 'Aktivity', icon: IconActivity },
  { to: '/app/more', label: 'Více', icon: IconDots },
];

const CHILD_TABS: TabItem[] = [
  { to: '/app/stars', label: 'Hvězdy', icon: IconStarFilled },
  { to: '/app/wishes', label: 'Přání', icon: IconGift },
  { to: '/app/more', label: 'Více', icon: IconDots },
];

export function AppShellLayout() {
  const { state, dispatch } = useApp();
  const logout = useLogout();
  const navigate = useNavigate();
  const isParent = state.role === 'parent';
  const tabs = isParent ? PARENT_TABS : CHILD_TABS;

  const childrenQuery = useChildren(isParent);
  const activeChild = childrenQuery.data?.find(
    (c) => c.id === state.activeChildId,
  );

  return (
    <AppShell
      header={{ height: 56 }}
      padding={0}
      className={classes.shell}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
            <IconStarFilled size={22} color="var(--mantine-color-yellow-5)" />
            <Title order={4} fw={700} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Hvězdy
            </Title>
          </Group>

          {isParent && childrenQuery.data && childrenQuery.data.length > 0 && (
            <Menu width={220} position="bottom-end" shadow="md">
              <Menu.Target>
                <Group gap={6} wrap="nowrap" style={{ cursor: 'pointer' }}>
                  <Avatar
                    size="sm"
                    src={activeChild?.photoUrl}
                    name={activeChild?.displayName}
                    color="grape"
                    radius="xl"
                  />
                  <Text fz="sm" fw={500} truncate maw={100}>
                    {activeChild?.displayName ?? 'Vyber dítě'}
                  </Text>
                  <IconChevronDown size={14} />
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Aktivní dítě</Menu.Label>
                {childrenQuery.data.map((c) => (
                  <Menu.Item
                    key={c.id}
                    leftSection={
                      <Avatar size="sm" src={c.photoUrl} name={c.displayName} radius="xl" />
                    }
                    onClick={() =>
                      dispatch({ type: 'SELECT_CHILD', payload: c.id })
                    }
                  >
                    {c.displayName}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          )}

          <Menu width={200} position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle" radius="xl" size="lg" aria-label="Účet">
                <Avatar
                  size={28}
                  src={state.user?.photoUrl}
                  name={state.user?.displayName}
                  radius="xl"
                />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{state.user?.email}</Menu.Label>
              <Menu.Item leftSection={<IconUser size={16} />} onClick={() => navigate('/app/more')}>
                Můj účet
              </Menu.Item>
              {state.isAdmin && (
                <Menu.Item
                  leftSection={<IconCrown size={16} />}
                  onClick={() => navigate('/app/admin')}
                >
                  Admin
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={() => logout.mutate()}
              >
                Odhlásit se
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Main className={classes.main}>
        <OnlineStatusBanner />
        <Outlet />
      </AppShell.Main>

      <BottomTabs items={tabs} />
    </AppShell>
  );
}

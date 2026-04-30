import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  CopyButton,
  Divider,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconCopy,
  IconCrown,
  IconKey,
  IconLogout,
  IconPlus,
  IconTrash,
  IconUserMinus,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { DataState } from '../components/DataState';
import { OfflineGate } from '../components/OfflineGate';
import {
  useChildInvitations,
  useChildren,
  useFamily,
} from '../api/queries';
import {
  useCreateInvitation,
  useDeleteChild,
  useDeleteInvitation,
  useLogout,
} from '../api/mutations';
import { useApp } from '../state/AppContext';

export function MorePage() {
  const { state } = useApp();
  const isParent = state.role === 'parent';
  const familyQuery = useFamily(true);
  const logout = useLogout();

  return (
    <Stack gap="md" pt="md" px="md">
      <Title order={3}>Více</Title>

      {/* Účet */}
      <Card withBorder padding="md" radius="lg">
        <Group>
          <Avatar
            src={state.user?.photoUrl}
            name={state.user?.displayName}
            size="lg"
            radius="xl"
          />
          <Stack gap={0} style={{ flex: 1 }}>
            <Text fw={600}>{state.user?.displayName}</Text>
            <Text c="dimmed" fz="sm" truncate>
              {state.user?.email}
            </Text>
            <Group gap={4} mt={4}>
              <Badge size="xs" color={isParent ? 'grape' : 'yellow'}>
                {isParent ? 'Rodič' : 'Dítě'}
              </Badge>
              {state.isAdmin && (
                <Badge size="xs" color="red" leftSection={<IconCrown size={10} />}>
                  Admin
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>
      </Card>

      {/* Rodina */}
      <DataState query={familyQuery}>
        {(family) => (
          <Card withBorder padding="md" radius="lg">
            <Stack gap="xs">
              <Text fz="sm" fw={500} c="dimmed">
                Rodina
              </Text>
              <Text fw={600}>{family.name}</Text>
              {isParent && (
                <>
                  <Divider />
                  <Text fz="xs" c="dimmed">
                    Kód pro pozvání druhého rodiče
                  </Text>
                  <Group justify="space-between">
                    <Text ff="monospace" fz="lg" fw={700}>
                      {family.code}
                    </Text>
                    <CopyButton value={family.code} timeout={1500}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Zkopírováno' : 'Kopírovat'}>
                          <ActionIcon
                            variant="light"
                            color={copied ? 'teal' : 'grape'}
                            onClick={copy}
                          >
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                </>
              )}
            </Stack>
          </Card>
        )}
      </DataState>

      {isParent && <ChildInvitationsCard />}
      {isParent && <ChildrenManagementCard />}

      {state.isAdmin && (
        <Button
          component={Link}
          to="/app/admin"
          leftSection={<IconCrown size={18} />}
          variant="light"
          color="red"
          size="md"
        >
          Admin
        </Button>
      )}

      <Button
        leftSection={<IconLogout size={18} />}
        variant="light"
        color="red"
        size="md"
        onClick={() => logout.mutate()}
      >
        Odhlásit se
      </Button>
    </Stack>
  );
}

function ChildInvitationsCard() {
  const query = useChildInvitations(true);
  const create = useCreateInvitation();
  const del = useDeleteInvitation();

  return (
    <Card withBorder padding="md" radius="lg">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={600}>Pozvánky pro děti</Text>
          <OfflineGate message="">
            <Button
              size="compact-md"
              leftSection={<IconPlus size={14} />}
              onClick={() => create.mutate()}
              loading={create.isPending}
            >
              Nový klíč
            </Button>
          </OfflineGate>
        </Group>
        <DataState
          query={query}
          emptyWhen={(d) => d.length === 0}
          empty={
            <Text c="dimmed" fz="sm">
              Klikni „Nový klíč" pro vygenerování pozvánky.
            </Text>
          }
        >
          {(invitations) => (
            <Stack gap="xs">
              {invitations.map((inv) => {
                const used = !!inv.usedAt;
                return (
                  <Group
                    key={inv.id}
                    gap="xs"
                    wrap="nowrap"
                    p="xs"
                    style={{
                      border: '1px solid var(--mantine-color-default-border)',
                      borderRadius: 8,
                    }}
                  >
                    <IconKey size={16} />
                    <Text ff="monospace" fz="sm" style={{ flex: 1 }} truncate>
                      {inv.code}
                    </Text>
                    {used ? (
                      <Badge size="xs" color="gray">
                        použito
                      </Badge>
                    ) : (
                      <>
                        <CopyButton value={inv.code} timeout={1500}>
                          {({ copied, copy }) => (
                            <ActionIcon
                              variant="subtle"
                              color={copied ? 'teal' : 'grape'}
                              onClick={copy}
                              size="sm"
                              aria-label="Kopírovat"
                            >
                              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </ActionIcon>
                          )}
                        </CopyButton>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          size="sm"
                          onClick={() => del.mutate(inv.id)}
                          aria-label="Smazat"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </>
                    )}
                  </Group>
                );
              })}
            </Stack>
          )}
        </DataState>
      </Stack>
    </Card>
  );
}

function ChildrenManagementCard() {
  const query = useChildren(true);
  const del = useDeleteChild();

  return (
    <Card withBorder padding="md" radius="lg">
      <Stack gap="xs">
        <Text fw={600}>Děti v rodině</Text>
        <DataState
          query={query}
          emptyWhen={(d) => d.length === 0}
          empty={
            <Text c="dimmed" fz="sm">
              Žádné registrované děti.
            </Text>
          }
        >
          {(children) => (
            <Stack gap="xs">
              {children.map((c) => (
                <Group key={c.id} gap="sm" wrap="nowrap">
                  <Avatar src={c.photoUrl} name={c.displayName} size="sm" radius="xl" />
                  <Text fz="sm" fw={500} style={{ flex: 1 }} truncate>
                    {c.displayName}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    aria-label="Odebrat"
                    onClick={() => {
                      if (confirm(`Opravdu odebrat ${c.displayName}?`)) {
                        del.mutate(c.id);
                      }
                    }}
                  >
                    <IconUserMinus size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}
        </DataState>
      </Stack>
    </Card>
  );
}

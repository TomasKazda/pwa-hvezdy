import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { apiFetch } from '../api/client';
import { qk } from '../api/queries';
import { DataState } from '../components/DataState';
import { OfflineGate } from '../components/OfflineGate';
import type { ChildInvitation, Family, User } from '../types';

export function AdminPage() {
  const navigate = useNavigate();
  return (
    <Stack gap="md" pt="md" px="md">
      <Group>
        <ActionIcon
          variant="subtle"
          onClick={() => navigate('/app/more')}
          aria-label="Zpět"
        >
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Title order={3}>Admin</Title>
      </Group>

      <Tabs defaultValue="users" variant="pills" radius="md" keepMounted={false}>
        <Tabs.List grow>
          <Tabs.Tab value="users">Uživatelé</Tabs.Tab>
          <Tabs.Tab value="families">Rodiny</Tabs.Tab>
          <Tabs.Tab value="invitations">Pozvánky</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users" pt="md">
          <UsersTab />
        </Tabs.Panel>
        <Tabs.Panel value="families" pt="md">
          <FamiliesTab />
        </Tabs.Panel>
        <Tabs.Panel value="invitations" pt="md">
          <InvitationsTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function useDeleteAdmin(path: (id: number) => string, queryKey: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(path(id), { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

function UsersTab() {
  const query = useQuery({
    queryKey: qk.adminUsers,
    queryFn: () => apiFetch<{ users: User[] }>('/api/admin/users').then((r) => r.users),
  });
  const del = useDeleteAdmin((id) => `/api/admin/users/${id}`, qk.adminUsers);

  return (
    <DataState query={query} emptyWhen={(d) => d.length === 0}>
      {(users) => (
        <Card withBorder padding={0} radius="md">
          <ScrollArea>
            <Table verticalSpacing="xs" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Jméno</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Family</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((u) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.id}</Table.Td>
                    <Table.Td>{u.displayName}</Table.Td>
                    <Table.Td>
                      <Text fz="xs">{u.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      {u.role && (
                        <Badge size="xs" color={u.role === 'parent' ? 'grape' : 'yellow'}>
                          {u.role}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>{u.familyId ?? '-'}</Table.Td>
                    <Table.Td>
                      <OfflineGate message="">
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Smazat ${u.displayName}?`)) del.mutate(u.id);
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </OfflineGate>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </DataState>
  );
}

function FamiliesTab() {
  const query = useQuery({
    queryKey: qk.adminFamilies,
    queryFn: () =>
      apiFetch<{ families: Family[] }>('/api/admin/families').then((r) => r.families),
  });
  const del = useDeleteAdmin((id) => `/api/admin/families/${id}`, qk.adminFamilies);

  return (
    <DataState query={query} emptyWhen={(d) => d.length === 0}>
      {(families) => (
        <Stack gap="xs">
          {families.map((f) => (
            <Card key={f.id} withBorder padding="sm" radius="md">
              <Group justify="space-between">
                <Stack gap={2}>
                  <Text fw={600}>{f.name}</Text>
                  <Text fz="xs" ff="monospace" c="dimmed">
                    {f.code}
                  </Text>
                </Stack>
                <OfflineGate message="">
                  <Button
                    variant="subtle"
                    color="red"
                    size="compact-sm"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => {
                      if (confirm(`Smazat rodinu ${f.name}?`)) del.mutate(f.id);
                    }}
                  >
                    Smazat
                  </Button>
                </OfflineGate>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </DataState>
  );
}

function InvitationsTab() {
  const query = useQuery({
    queryKey: qk.adminInvitations,
    queryFn: () =>
      apiFetch<{ invitations: ChildInvitation[] }>('/api/admin/child-invitations').then(
        (r) => r.invitations,
      ),
  });
  const del = useDeleteAdmin(
    (id) => `/api/admin/child-invitations/${id}`,
    qk.adminInvitations,
  );

  return (
    <DataState query={query} emptyWhen={(d) => d.length === 0}>
      {(invitations) => (
        <Stack gap="xs">
          {invitations.map((inv) => (
            <Card key={inv.id} withBorder padding="sm" radius="md">
              <Group justify="space-between">
                <Stack gap={2}>
                  <Text ff="monospace" fz="sm">
                    {inv.code}
                  </Text>
                  {inv.usedAt && (
                    <Badge size="xs" color="gray">
                      použito
                    </Badge>
                  )}
                </Stack>
                <OfflineGate message="">
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => del.mutate(inv.id)}
                    aria-label="Smazat"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </OfflineGate>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </DataState>
  );
}

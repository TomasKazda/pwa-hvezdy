import {
  ActionIcon,
  Button,
  Card,
  Group,
  NumberInput,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconActivity, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { OfflineGate } from '../components/OfflineGate';
import { useActivityTypes } from '../api/queries';
import {
  useCreateActivityType,
  useDeleteActivityType,
  useUpdateActivityType,
} from '../api/mutations';
import type { ActivityType } from '../types';

export function ActivityTypesPage() {
  const query = useActivityTypes(true);
  const create = useCreateActivityType();
  const [adding, setAdding] = useState(false);

  const form = useForm({
    initialValues: { name: '', defaultStars: 1 },
    validate: { name: (v) => (v.trim() ? null : 'Vyplň název') },
  });

  return (
    <Stack gap="md" pt="md" px="md">
      <Group justify="space-between">
        <Title order={3}>Aktivity</Title>
        {!adding && (
          <Button
            leftSection={<IconPlus size={16} />}
            size="compact-md"
            onClick={() => setAdding(true)}
          >
            Přidat
          </Button>
        )}
      </Group>

      {adding && (
        <OfflineGate>
          <Card withBorder padding="md" radius="md">
            <form
              onSubmit={form.onSubmit((v) => {
                create.mutate(
                  { name: v.name.trim(), defaultStars: v.defaultStars },
                  {
                    onSuccess: () => {
                      form.reset();
                      setAdding(false);
                    },
                  },
                );
              })}
            >
              <Stack gap="sm">
                <TextInput
                  label="Název aktivity"
                  placeholder="Úklid pokoje"
                  {...form.getInputProps('name')}
                />
                <NumberInput
                  label="Výchozí počet hvězd"
                  min={1}
                  {...form.getInputProps('defaultStars')}
                />
                <Group grow>
                  <Button variant="default" onClick={() => setAdding(false)}>
                    Zrušit
                  </Button>
                  <Button type="submit" loading={create.isPending}>
                    Přidat
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </OfflineGate>
      )}

      <DataState
        query={query}
        emptyWhen={(d) => d.length === 0}
        empty={
          <EmptyState
            icon={IconActivity}
            title="Žádné aktivity"
            description="Přidej kategorie, ze kterých budeš později vybírat při udělování hvězd."
          />
        }
      >
        {(types) => (
          <Stack gap="xs">
            {types.map((t) => (
              <ActivityRow key={t.id} item={t} />
            ))}
          </Stack>
        )}
      </DataState>
    </Stack>
  );
}

function ActivityRow({ item }: { item: ActivityType }) {
  const update = useUpdateActivityType();
  const del = useDeleteActivityType();
  const form = useForm({
    initialValues: { name: item.name, defaultStars: item.defaultStars },
  });

  const dirty =
    form.values.name !== item.name ||
    form.values.defaultStars !== item.defaultStars;

  return (
    <Card padding="sm" withBorder radius="md">
      <Group gap="xs" wrap="nowrap">
        <TextInput
          flex={1}
          {...form.getInputProps('name')}
          variant="unstyled"
        />
        <NumberInput
          w={70}
          min={1}
          {...form.getInputProps('defaultStars')}
          variant="filled"
        />
        {dirty && (
          <Button
            size="compact-sm"
            loading={update.isPending}
            onClick={() =>
              update.mutate({
                id: item.id,
                name: form.values.name,
                defaultStars: form.values.defaultStars,
              })
            }
          >
            Uložit
          </Button>
        )}
        <ActionIcon
          color="red"
          variant="subtle"
          onClick={() => del.mutate(item.id)}
          loading={del.isPending}
          aria-label="Smazat"
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );
}

import {
  ActionIcon,
  Affix,
  Badge,
  Button,
  Card,
  Drawer,
  Group,
  Modal,
  NumberInput,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import {
  IconCheck,
  IconGift,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { OfflineGate } from '../components/OfflineGate';
import { StarBalance } from '../components/StarBalance';
import { useChildren, useWishes } from '../api/queries';
import {
  useCreateWish,
  useDeleteWish,
  useFulfillWish,
  useUpdateWish,
} from '../api/mutations';
import { useApp, useOnlineStatus } from '../state/AppContext';
import type { Child, Wish } from '../types';

type WishWithReachable = Wish & { reachable?: boolean | null };

export function WishesPage() {
  const { state } = useApp();
  const isParent = state.role === 'parent';
  const wishesQuery = useWishes();
  const childrenQuery = useChildren(isParent);
  const online = useOnlineStatus();

  const [createOpened, createDrawer] = useDisclosure(false);
  const [editing, setEditing] = useState<WishWithReachable | null>(null);

  return (
    <Stack gap="md" pt="md" px="md">
      <Title order={3}>Přání</Title>
      <DataState
        query={wishesQuery}
        emptyWhen={(d) => d.wishes.length === 0}
        empty={
          <EmptyState
            icon={IconGift}
            title="Zatím žádná přání"
            description="Přidej první přání tlačítkem +"
          />
        }
      >
        {(data) => (
          <>
            {!isParent && data.balance !== undefined && (
              <Card withBorder padding="md" radius="lg" bg="grape.0">
                <Group justify="space-between">
                  <Text fz="sm" fw={500}>
                    Tvůj zůstatek
                  </Text>
                  <StarBalance amount={data.balance} size="lg" />
                </Group>
              </Card>
            )}
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
              {data.wishes.map((w) => (
                <WishCard
                  key={w.id}
                  wish={w}
                  myBalance={data.balance}
                  onClick={() => setEditing(w)}
                />
              ))}
            </SimpleGrid>
          </>
        )}
      </DataState>

      <Affix position={{ bottom: 80, right: 20 }}>
        <ActionIcon
          size={56}
          radius="xl"
          color="grape"
          variant="filled"
          onClick={createDrawer.open}
          disabled={!online}
          aria-label="Přidat přání"
          style={{ boxShadow: 'var(--mantine-shadow-md)' }}
        >
          <IconPlus size={26} />
        </ActionIcon>
      </Affix>

      <Drawer
        opened={createOpened}
        onClose={createDrawer.close}
        position="bottom"
        size="auto"
        title="Nové přání"
      >
        <OfflineGate>
          <CreateWishForm isParent={isParent} onDone={createDrawer.close} />
        </OfflineGate>
      </Drawer>

      <Modal
        opened={!!editing}
        onClose={() => setEditing(null)}
        title="Detail přání"
        centered
      >
        {editing && (
          <WishDetail
            wish={editing}
            isParent={isParent}
            children={childrenQuery.data ?? []}
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>
    </Stack>
  );
}

function WishCard({
  wish,
  myBalance,
  onClick,
}: {
  wish: WishWithReachable;
  myBalance?: number;
  onClick: () => void;
}) {
  const cost = wish.starCost ?? null;
  const progress =
    cost !== null && myBalance !== undefined
      ? Math.min(100, Math.round((myBalance / cost) * 100))
      : null;

  return (
    <Card
      padding="md"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      radius="lg"
      withBorder
    >
      <Stack gap="xs" h="100%">
        <Group gap={4} justify="space-between">
          {cost !== null ? (
            <StarBalance amount={cost} size="sm" />
          ) : (
            <Badge size="xs" color="gray" variant="light">
              bez ceny
            </Badge>
          )}
          {wish.isPersistent && (
            <Badge size="xs" color="grape" variant="light">
              opakované
            </Badge>
          )}
        </Group>
        <Text fw={600} fz="sm" lineClamp={3}>
          {wish.title}
        </Text>
        {progress !== null && (
          <Progress
            value={progress}
            color={progress >= 100 ? 'teal' : 'grape'}
            size="sm"
            radius="xl"
            mt="auto"
          />
        )}
        {wish.reachable === true && progress === null && (
          <Badge color="teal" variant="light" size="xs">
            Dosažitelné
          </Badge>
        )}
      </Stack>
    </Card>
  );
}

function CreateWishForm({
  isParent,
  onDone,
}: {
  isParent: boolean;
  onDone: () => void;
}) {
  const create = useCreateWish();
  const form = useForm({
    initialValues: {
      title: '',
      starCost: 10 as number | undefined,
      isPersistent: false,
    },
    validate: {
      title: (v) => (v.trim() ? null : 'Vyplň název'),
    },
  });

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        create.mutate(
          {
            title: values.title.trim(),
            starCost: isParent ? values.starCost : undefined,
            isPersistent: isParent ? values.isPersistent : undefined,
          },
          { onSuccess: () => onDone() },
        );
      })}
    >
      <Stack gap="md">
        <TextInput
          label="Název přání"
          placeholder="Nový plyšák"
          {...form.getInputProps('title')}
        />
        {isParent && (
          <>
            <NumberInput
              label="Cena (hvězdy)"
              min={1}
              {...form.getInputProps('starCost')}
            />
            <Switch
              label="Opakované přání (po splnění zůstává v seznamu)"
              {...form.getInputProps('isPersistent', { type: 'checkbox' })}
            />
          </>
        )}
        <Button type="submit" loading={create.isPending} size="md">
          Přidat přání
        </Button>
      </Stack>
    </form>
  );
}

function WishDetail({
  wish,
  isParent,
  children,
  onClose,
}: {
  wish: WishWithReachable;
  isParent: boolean;
  children: Child[];
  onClose: () => void;
}) {
  const update = useUpdateWish();
  const del = useDeleteWish();
  const fulfill = useFulfillWish();
  const [editMode, setEditMode] = useState(false);
  const [fulfillChildId, setFulfillChildId] = useState<string | null>(
    children[0] ? String(children[0].id) : null,
  );

  const form = useForm({
    initialValues: {
      title: wish.title,
      starCost: wish.starCost ?? undefined,
      isPersistent: wish.isPersistent,
    },
  });

  if (editMode && isParent) {
    return (
      <OfflineGate>
        <form
          onSubmit={form.onSubmit((values) => {
            update.mutate(
              {
                id: wish.id,
                title: values.title.trim(),
                starCost: values.starCost,
                isPersistent: values.isPersistent,
              },
              { onSuccess: () => onClose() },
            );
          })}
        >
          <Stack gap="md">
            <TextInput label="Název" {...form.getInputProps('title')} />
            <NumberInput
              label="Cena (hvězdy)"
              min={1}
              {...form.getInputProps('starCost')}
            />
            <Switch
              label="Opakované přání"
              {...form.getInputProps('isPersistent', { type: 'checkbox' })}
            />
            <Group grow>
              <Button variant="default" onClick={() => setEditMode(false)}>
                Zrušit
              </Button>
              <Button type="submit" loading={update.isPending}>
                Uložit
              </Button>
            </Group>
          </Stack>
        </form>
      </OfflineGate>
    );
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={4}>{wish.title}</Title>
        <Group gap="xs">
          {wish.starCost !== null && <StarBalance amount={wish.starCost} size="md" />}
          {wish.isPersistent && (
            <Badge color="grape" variant="light">
              opakované
            </Badge>
          )}
        </Group>
      </Stack>

      {isParent ? (
        <OfflineGate>
          {wish.starCost !== null && children.length > 0 && (
            <Card withBorder padding="md" radius="md">
              <Stack gap="sm">
                <Text fz="sm" fw={500}>
                  Splnit pro:
                </Text>
                <Select
                  data={children.map((c) => ({
                    value: String(c.id),
                    label: `${c.displayName} (${c.balance}⭐)`,
                  }))}
                  value={fulfillChildId}
                  onChange={setFulfillChildId}
                  allowDeselect={false}
                />
                <Button
                  color="teal"
                  leftSection={<IconCheck size={16} />}
                  loading={fulfill.isPending}
                  disabled={!fulfillChildId}
                  onClick={() => {
                    if (!fulfillChildId) return;
                    fulfill.mutate(
                      { id: wish.id, childId: Number(fulfillChildId) },
                      { onSuccess: () => onClose() },
                    );
                  }}
                >
                  Splnit přání
                </Button>
              </Stack>
            </Card>
          )}
          <Group grow>
            <Button
              variant="default"
              leftSection={<IconPencil size={16} />}
              onClick={() => setEditMode(true)}
            >
              Upravit
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={16} />}
              loading={del.isPending}
              onClick={() => del.mutate(wish.id, { onSuccess: onClose })}
            >
              Smazat
            </Button>
          </Group>
        </OfflineGate>
      ) : (
        <Text c="dimmed" fz="sm">
          O splnění rozhodují rodiče.
        </Text>
      )}
    </Stack>
  );
}

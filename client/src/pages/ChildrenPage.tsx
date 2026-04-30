import {
  ActionIcon,
  Affix,
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  Group,
  NumberInput,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import {
  IconCalendar,
  IconMinus,
  IconPlus,
  IconStarFilled,
  IconUsers,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { OfflineGate } from '../components/OfflineGate';
import { StarBalance } from '../components/StarBalance';
import {
  useActivityTypes,
  useChildren,
  useFulfilledWishes,
  useTransactions,
} from '../api/queries';
import { useCreateTransaction } from '../api/mutations';
import { useApp, useOnlineStatus } from '../state/AppContext';
import classes from './ChildrenPage.module.css';
import type { Child, Transaction, Wish } from '../types';

export function ChildrenPage() {
  const { state, dispatch } = useApp();
  const childrenQuery = useChildren(true);
  const [drawerOpened, drawer] = useDisclosure(false);
  const online = useOnlineStatus();

  // Auto-select první dítě, pokud aktivní není v seznamu
  useEffect(() => {
    const list = childrenQuery.data;
    if (!list || list.length === 0) return;
    const exists = list.some((c) => c.id === state.activeChildId);
    if (!exists) {
      dispatch({ type: 'SELECT_CHILD', payload: list[0].id });
    }
  }, [childrenQuery.data, state.activeChildId, dispatch]);

  return (
    <>
      <DataState
        query={childrenQuery}
        emptyWhen={(d) => d.length === 0}
        empty={
          <EmptyState
            icon={IconUsers}
            title="Zatím žádné děti"
            description="V sekci Více vygeneruj klíč pro registraci dítěte."
          />
        }
      >
        {(children) => {
          const active = children.find((c) => c.id === state.activeChildId) ?? children[0];
          return (
            <Stack gap="md" pt="md">
              {/* Film strip karet */}
              <ScrollArea
                type="never"
                offsetScrollbars={false}
                scrollbars="x"
                className={classes.strip}
              >
                <Group gap="sm" wrap="nowrap" px="md" py={4}>
                  {children.map((c) => (
                    <ChildCard
                      key={c.id}
                      child={c}
                      active={c.id === active.id}
                      onSelect={() =>
                        dispatch({ type: 'SELECT_CHILD', payload: c.id })
                      }
                    />
                  ))}
                </Group>
              </ScrollArea>

              {/* Detail aktivního dítěte */}
              <ChildDetail child={active} />
            </Stack>
          );
        }}
      </DataState>

      {childrenQuery.data && childrenQuery.data.length > 0 && (
        <Affix position={{ bottom: 80, right: 20 }}>
          <ActionIcon
            size={56}
            radius="xl"
            color="grape"
            variant="filled"
            onClick={drawer.open}
            disabled={!online}
            title={online ? 'Přidat hvězdy' : 'Offline'}
            aria-label="Přidat hvězdy"
            style={{ boxShadow: 'var(--mantine-shadow-md)' }}
          >
            <IconPlus size={26} />
          </ActionIcon>
        </Affix>
      )}

      <Drawer
        opened={drawerOpened}
        onClose={drawer.close}
        position="bottom"
        size="auto"
        title="Přidat / odebrat hvězdy"
      >
        <OfflineGate>
          <AddTransactionForm
            children={childrenQuery.data ?? []}
            defaultChildId={state.activeChildId}
            onDone={drawer.close}
          />
        </OfflineGate>
      </Drawer>
    </>
  );
}

function ChildCard({
  child,
  active,
  onSelect,
}: {
  child: Child;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      padding="md"
      onClick={onSelect}
      className={classes.card}
      data-active={active || undefined}
    >
      <Stack gap="xs" align="center" w={140}>
        <Avatar
          src={child.photoUrl}
          name={child.displayName}
          size={56}
          radius="xl"
          color="grape"
        />
        <Text fw={600} fz="sm" ta="center" lineClamp={1}>
          {child.displayName}
        </Text>
        <StarBalance amount={child.balance} size="md" />
      </Stack>
    </Card>
  );
}

function ChildDetail({ child }: { child: Child }) {
  return (
    <Stack gap="xs" px="md" pb="md">
      <Group justify="space-between">
        <Title order={4}>{child.displayName}</Title>
        <StarBalance amount={child.balance} size="lg" />
      </Group>

      <Tabs defaultValue="transactions" variant="pills" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="transactions" leftSection={<IconCalendar size={14} />}>
            Pohyby
          </Tabs.Tab>
          <Tabs.Tab value="fulfilled" leftSection={<IconStarFilled size={14} />}>
            Splněná přání
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="transactions" pt="md">
          <TransactionList childId={child.id} />
        </Tabs.Panel>

        <Tabs.Panel value="fulfilled" pt="md">
          <FulfilledWishesList childId={child.id} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function TransactionList({ childId }: { childId: number }) {
  const query = useTransactions(childId);
  return (
    <DataState
      query={query}
      emptyWhen={(d) => d.length === 0}
      empty={<EmptyState icon={IconCalendar} title="Zatím žádné pohyby" />}
    >
      {(txs) => (
        <Stack gap="xs">
          {txs.map((t) => (
            <TransactionRow key={t.id} tx={t} />
          ))}
        </Stack>
      )}
    </DataState>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const positive = tx.amount >= 0;
  return (
    <Card padding="sm" radius="md" withBorder>
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
          <Text fz="sm" fw={500} truncate>
            {tx.description}
          </Text>
          <Text fz="xs" c="dimmed">
            {new Date(tx.createdAt).toLocaleString('cs-CZ', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </Text>
        </Stack>
        <Badge
          color={positive ? 'teal' : 'red'}
          variant="light"
          size="lg"
          leftSection={<IconStarFilled size={12} />}
        >
          {positive ? '+' : ''}
          {tx.amount}
        </Badge>
      </Group>
    </Card>
  );
}

function FulfilledWishesList({ childId }: { childId: number }) {
  const query = useFulfilledWishes(childId);
  return (
    <DataState
      query={query}
      emptyWhen={(d) => d.length === 0}
      empty={<EmptyState icon={IconStarFilled} title="Zatím žádná splněná přání" />}
    >
      {(wishes) => (
        <Stack gap="xs">
          {wishes.map((w: Wish) => (
            <Card key={w.id} padding="sm" radius="md" withBorder>
              <Group justify="space-between">
                <Text fz="sm" fw={500}>
                  {w.title}
                </Text>
                {w.starCost !== null && <StarBalance amount={w.starCost} size="sm" />}
              </Group>
              {w.fulfilledAt && (
                <Text fz="xs" c="dimmed" mt={2}>
                  {new Date(w.fulfilledAt).toLocaleDateString('cs-CZ')}
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      )}
    </DataState>
  );
}

function AddTransactionForm({
  children,
  defaultChildId,
  onDone,
}: {
  children: Child[];
  defaultChildId: number | null;
  onDone: () => void;
}) {
  const activityTypesQuery = useActivityTypes(true);
  const create = useCreateTransaction();
  const [direction, setDirection] = useState<'add' | 'remove'>('add');

  const form = useForm<{
    childId: number | null;
    categoryId: number | null;
    amount: number;
    description: string;
  }>({
    initialValues: {
      childId: defaultChildId ?? children[0]?.id ?? null,
      categoryId: null,
      amount: 1,
      description: '',
    },
    validate: {
      childId: (v) => (v ? null : 'Vyber dítě'),
      amount: (v) => (v && v > 0 ? null : 'Zadej kladné číslo'),
      description: (v) => (v.trim() ? null : 'Vyplň popis'),
    },
  });

  const childOptions = useMemo(
    () =>
      children.map((c) => ({
        value: String(c.id),
        label: c.displayName,
      })),
    [children],
  );

  const activityOptions = useMemo(
    () =>
      (activityTypesQuery.data ?? []).map((a) => ({
        value: String(a.id),
        label: `${a.name} (${a.defaultStars}⭐)`,
      })),
    [activityTypesQuery.data],
  );

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        create.mutate(
          {
            childId: values.childId!,
            amount: direction === 'add' ? values.amount : -values.amount,
            description: values.description.trim(),
            categoryId: values.categoryId ?? undefined,
          },
          { onSuccess: () => onDone() },
        );
      })}
    >
      <Stack gap="md">
        <Select
          label="Dítě"
          data={childOptions}
          value={form.values.childId ? String(form.values.childId) : null}
          onChange={(v) => form.setFieldValue('childId', v ? Number(v) : null)}
          allowDeselect={false}
        />
        <SegmentedControl
          fullWidth
          value={direction}
          onChange={(v) => setDirection(v as 'add' | 'remove')}
          data={[
            { label: 'Přidat ⭐', value: 'add' },
            { label: 'Odebrat ⭐', value: 'remove' },
          ]}
          color={direction === 'add' ? 'teal' : 'red'}
        />
        <Select
          label="Aktivita (volitelné)"
          placeholder="Vyber kategorii"
          data={activityOptions}
          value={form.values.categoryId ? String(form.values.categoryId) : null}
          onChange={(v) => {
            form.setFieldValue('categoryId', v ? Number(v) : null);
            const a = activityTypesQuery.data?.find((x) => String(x.id) === v);
            if (a) {
              form.setFieldValue('amount', a.defaultStars);
              if (!form.values.description) {
                form.setFieldValue('description', a.name);
              }
            }
          }}
          clearable
        />
        <NumberInput
          label="Počet hvězd"
          min={1}
          {...form.getInputProps('amount')}
          leftSection={
            direction === 'remove' ? <IconMinus size={14} /> : <IconPlus size={14} />
          }
        />
        <TextInput
          label="Popis"
          placeholder="Za co?"
          {...form.getInputProps('description')}
        />
        <Button type="submit" loading={create.isPending} size="md">
          Uložit
        </Button>
      </Stack>
    </form>
  );
}

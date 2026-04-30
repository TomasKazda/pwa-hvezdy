import { Card, Center, Stack, Tabs, Text } from '@mantine/core';
import { IconCalendar, IconChartBar, IconStarFilled } from '@tabler/icons-react';
import { useMemo } from 'react';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { useTransactions } from '../api/queries';
import classes from './MyStarsPage.module.css';
import type { Transaction } from '../types';

export function MyStarsPage() {
  const query = useTransactions(null);

  const balance = useMemo(
    () => (query.data ?? []).reduce((sum, t) => sum + t.amount, 0),
    [query.data],
  );

  return (
    <Stack gap="lg" pt="lg" px="md">
      {/* Velký balance */}
      <Center>
        <Stack align="center" gap={4}>
          <Text c="dimmed" fz="sm" tt="uppercase" fw={600} style={{ letterSpacing: 1 }}>
            Tvoje hvězdy
          </Text>
          <div className={classes.bigBalance}>
            <IconStarFilled
              size={48}
              color="var(--mantine-color-yellow-5)"
            />
            <Text fz={72} fw={800} lh={1}>
              {balance}
            </Text>
          </div>
        </Stack>
      </Center>

      <Tabs defaultValue="history" variant="pills" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="history" leftSection={<IconCalendar size={14} />}>
            Historie
          </Tabs.Tab>
          <Tabs.Tab value="week" leftSection={<IconChartBar size={14} />}>
            Tento týden
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="history" pt="md">
          <DataState
            query={query}
            emptyWhen={(d) => d.length === 0}
            empty={
              <EmptyState
                icon={IconStarFilled}
                title="Zatím žádné hvězdy"
                description="Až ti rodič přidělí hvězdy, uvidíš je tady."
              />
            }
          >
            {(txs) => (
              <Stack gap="xs">
                {txs.map((t) => (
                  <TransactionRow key={t.id} tx={t} />
                ))}
              </Stack>
            )}
          </DataState>
        </Tabs.Panel>

        <Tabs.Panel value="week" pt="md">
          <DataState query={query}>
            {(txs) => <WeekSummary txs={txs} />}
          </DataState>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const positive = tx.amount >= 0;
  return (
    <Card padding="sm" withBorder radius="md">
      <Stack gap={2}>
        <Text fz="sm" fw={500}>
          {tx.description}
        </Text>
        <Text fz="xs" c="dimmed">
          {new Date(tx.createdAt).toLocaleString('cs-CZ', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </Text>
      </Stack>
      <Text
        fz="lg"
        fw={700}
        c={positive ? 'teal' : 'red'}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
      >
        {positive ? '+' : ''}
        {tx.amount} ⭐
      </Text>
    </Card>
  );
}

function WeekSummary({ txs }: { txs: Transaction[] }) {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const recent = txs.filter((t) => new Date(t.createdAt).getTime() > weekAgo);
  const earned = recent.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = recent.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <Stack gap="sm">
      <Card withBorder padding="md" radius="md" bg="teal.0">
        <Text fz="sm" fw={500}>
          Získáno
        </Text>
        <Text fz="xl" fw={700} c="teal">
          +{earned} ⭐
        </Text>
      </Card>
      <Card withBorder padding="md" radius="md" bg="red.0">
        <Text fz="sm" fw={500}>
          Utraceno
        </Text>
        <Text fz="xl" fw={700} c="red">
          {spent} ⭐
        </Text>
      </Card>
      <Card withBorder padding="md" radius="md">
        <Text fz="sm" fw={500}>
          Počet aktivit
        </Text>
        <Text fz="xl" fw={700}>
          {recent.length}
        </Text>
      </Card>
    </Stack>
  );
}

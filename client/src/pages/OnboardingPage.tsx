import {
  Button,
  Card,
  Center,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconArrowLeft,
  IconKey,
  IconUserPlus,
  IconUsersGroup,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import {
  useCreateFamily,
  useJoinFamily,
  useRegisterChild,
} from '../api/mutations';
import { OfflineGate } from '../components/OfflineGate';
import { useApp } from '../state/AppContext';

type Step = 'role' | 'parent' | 'child';

export function OnboardingPage() {
  const { state, isOnboarded, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('role');

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isOnboarded) return <Navigate to="/app" replace />;

  return (
    <Container size="xs" py="xl" px="md">
      <Stack gap="xl">
        <Stack gap={4}>
          <Text c="dimmed" fz="sm">
            Vítej, {state.user?.displayName}
          </Text>
          <Title order={2}>Pojďme tě připojit</Title>
        </Stack>

        {step === 'role' && <RoleStep onChoose={setStep} />}
        {step === 'parent' && (
          <ParentStep
            onBack={() => setStep('role')}
            onDone={() => navigate('/app')}
          />
        )}
        {step === 'child' && (
          <ChildStep
            onBack={() => setStep('role')}
            onDone={() => navigate('/app')}
          />
        )}
      </Stack>
    </Container>
  );
}

function RoleStep({ onChoose }: { onChoose: (s: Step) => void }) {
  return (
    <Stack gap="md">
      <Card padding="lg" onClick={() => onChoose('parent')} style={{ cursor: 'pointer' }}>
        <Group>
          <Center w={48} h={48} bg="grape.1" style={{ borderRadius: 12 }}>
            <IconUsersGroup color="var(--mantine-color-grape-7)" />
          </Center>
          <Stack gap={2} style={{ flex: 1 }}>
            <Text fw={600}>Jsem rodič</Text>
            <Text fz="sm" c="dimmed">
              Založím rodinu nebo se připojím kódem
            </Text>
          </Stack>
        </Group>
      </Card>
      <Card padding="lg" onClick={() => onChoose('child')} style={{ cursor: 'pointer' }}>
        <Group>
          <Center w={48} h={48} bg="yellow.1" style={{ borderRadius: 12 }}>
            <IconKey color="var(--mantine-color-yellow-8)" />
          </Center>
          <Stack gap={2} style={{ flex: 1 }}>
            <Text fw={600}>Jsem dítě</Text>
            <Text fz="sm" c="dimmed">
              Mám klíč od rodičů
            </Text>
          </Stack>
        </Group>
      </Card>
    </Stack>
  );
}

function ParentStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const create = useCreateFamily();
  const join = useJoinFamily();
  const createForm = useForm({ initialValues: { name: '' } });
  const joinForm = useForm({ initialValues: { code: '' } });

  return (
    <OfflineGate>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={onBack}
        size="compact-sm"
        style={{ alignSelf: 'flex-start' }}
      >
        Zpět
      </Button>
      <Tabs defaultValue="create" variant="pills" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="create">Založit</Tabs.Tab>
          <Tabs.Tab value="join">Připojit se</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="create" pt="lg">
          <form onSubmit={createForm.onSubmit((v) => create.mutate(v, { onSuccess: onDone }))}>
            <Stack gap="md">
              <TextInput
                label="Název rodiny"
                placeholder="Novákovi"
                required
                {...createForm.getInputProps('name')}
              />
              <Button
                type="submit"
                loading={create.isPending}
                leftSection={<IconUserPlus size={18} />}
                size="md"
              >
                Založit rodinu
              </Button>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="join" pt="lg">
          <form onSubmit={joinForm.onSubmit((v) => join.mutate(v, { onSuccess: onDone }))}>
            <Stack gap="md">
              <Text fz="sm" c="dimmed" ta="center">
                Zadej 8znakový kód rodiny
              </Text>
              <CodeInput
                length={8}
                value={joinForm.values.code}
                onChange={(v) => joinForm.setFieldValue('code', v)}
              />
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={join.isPending}
                disabled={joinForm.values.code.length !== 8}
              >
                Připojit se
              </Button>
            </Stack>
          </form>
        </Tabs.Panel>
      </Tabs>
    </OfflineGate>
  );
}

function ChildStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const register = useRegisterChild();
  const form = useForm({ initialValues: { code: '' } });

  return (
    <OfflineGate>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={onBack}
        size="compact-sm"
        style={{ alignSelf: 'flex-start' }}
      >
        Zpět
      </Button>
      <form onSubmit={form.onSubmit((v) => register.mutate(v, { onSuccess: onDone }))}>
        <Stack gap="md">
          <Text fz="sm" c="dimmed" ta="center">
            Zadej 12znakový klíč od rodičů
          </Text>
          <CodeInput
            length={12}
            value={form.values.code}
            onChange={(v) => form.setFieldValue('code', v)}
          />
          <Button
            type="submit"
            fullWidth
            size="md"
            loading={register.isPending}
            disabled={form.values.code.length !== 12}
          >
            Připojit se k rodině
          </Button>
        </Stack>
      </form>
    </OfflineGate>
  );
}

function CodeInput({
  length,
  value,
  onChange,
}: {
  length: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChange={(e) => {
        const next = e.currentTarget.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, length);
        onChange(next);
      }}
      placeholder={'•'.repeat(length)}
      maxLength={length}
      autoComplete="one-time-code"
      inputMode="text"
      autoCapitalize="characters"
      autoCorrect="off"
      spellCheck={false}
      size="lg"
      styles={{
        input: {
          textAlign: 'center',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontWeight: 600,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
        },
      }}
    />
  );
}

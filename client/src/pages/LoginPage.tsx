import { Button, Center, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBrandGoogle, IconStarFilled } from '@tabler/icons-react';
import { Navigate } from 'react-router';
import { useApp } from '../state/AppContext';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useApp();
  if (!isLoading && isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <Center mih="100dvh" px="md">
      <Stack align="center" gap="xl" maw={360} w="100%">
        <ThemeIcon size={96} radius="xl" variant="light" color="yellow">
          <IconStarFilled size={56} />
        </ThemeIcon>
        <Stack gap="xs" align="center">
          <Title order={1} ta="center">
            Dej mi hvězdu
          </Title>
          <Text c="dimmed" ta="center">
            Motivační hvězdičky pro celou rodinu
          </Text>
        </Stack>
        <Button
          component="a"
          href="/api/auth/google"
          size="lg"
          fullWidth
          leftSection={<IconBrandGoogle size={20} />}
          variant="filled"
        >
          Přihlásit se přes Google
        </Button>
        <Text c="dimmed" fz="xs" ta="center">
          Přihlášením souhlasíš s ukládáním údajů potřebných pro fungování aplikace.
        </Text>
      </Stack>
    </Center>
  );
}

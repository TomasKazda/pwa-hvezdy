import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'grape',
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  headings: {
    fontWeight: '600',
  },
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
    Card: {
      defaultProps: { radius: 'lg', withBorder: true },
    },
  },
});

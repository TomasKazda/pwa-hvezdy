import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcssPresetMantine from 'postcss-preset-mantine'
import postcssSimpleVars from 'postcss-simple-vars'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        postcssPresetMantine(),
        postcssSimpleVars({
          variables: {
            'mantine-breakpoint-xs': '36em',
            'mantine-breakpoint-sm': '48em',
            'mantine-breakpoint-md': '62em',
            'mantine-breakpoint-lg': '75em',
            'mantine-breakpoint-xl': '88em',
          },
        }),
      ],
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})

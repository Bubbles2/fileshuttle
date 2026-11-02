import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Emit every asset as a file: the production CSP allows no data: URLs.
    assetsInlineLimit: 0,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/tests/setup.ts'],
        },
      },
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/**/*.test.ts', 'shared/**/*.test.ts'],
        },
      },
    ],
  },
});

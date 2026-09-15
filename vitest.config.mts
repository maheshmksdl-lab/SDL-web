import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Two projects:
 *   unit       — pure functions (registries, link/media/seo helpers, the query builder,
 *                the Lexical renderer's text extraction). Node environment.
 *   components — the section components, rendered with @testing-library/react in jsdom, each
 *                with full data / minimal data / every variant (plan §9.1).
 *
 * `@` resolves to the web root, matching tsconfig paths.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['tests/components/**/*.test.{ts,tsx}'],
          setupFiles: ['tests/setup.ts'],
        },
      },
    ],
  },
})

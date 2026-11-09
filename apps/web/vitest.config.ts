import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ['browser'], alias: {
    // Resolve the SvelteKit virtual name so component tests can mock navigation.
    '$app/navigation': fileURLToPath(new URL('./node_modules/@sveltejs/kit/src/runtime/app/navigation.js', import.meta.url))
  } },
  test: { environment: 'jsdom', include: ['src/**/*.spec.ts'], clearMocks: true }
});

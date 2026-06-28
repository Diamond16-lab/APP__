import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['shared/**', 'src/lib/**', 'server/**'],
      exclude: ['server/index.js', 'server/utils/seedDefaultUser.js'],
    },
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    // Os testes de API compartilham o mesmo banco, então rodam um arquivo por vez
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});

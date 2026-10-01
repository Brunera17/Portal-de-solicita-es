import 'dotenv/config';
import { defineConfig } from 'vitest/config';

/**
 * Os testes de API apagam e recriam os dados. Por isso usam TEST_DATABASE_URL (um banco
 * só para testes) e nunca o banco de desenvolvimento. Sem ela, os testes de API se recusam
 * a rodar (tests/api/banco-de-teste.ts); os unitários (`npm run test:unit`) não usam banco.
 */
const bancoDeTeste = process.env.TEST_DATABASE_URL;

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      ...(bancoDeTeste && { DATABASE_URL: bancoDeTeste }),
    },
    // Os testes de API compartilham o mesmo banco, então rodam um arquivo por vez
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});

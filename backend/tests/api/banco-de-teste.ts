/**
 * Proteção contra apagar o banco errado: os testes de API repopulam o banco,
 * então só rodam com TEST_DATABASE_URL (um banco exclusivo para testes).
 */
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'Defina TEST_DATABASE_URL (um banco exclusivo para testes) para rodar os testes de API. ' +
      'Eles apagam e recriam os dados. Veja backend/.env.example.',
  );
}

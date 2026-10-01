/**
 * Testes de integração: sobem a aplicação Express e usam o banco definido em DATABASE_URL.
 * ATENÇÃO: o banco é repopulado com os dados de demonstração antes da execução.
 */
import './banco-de-teste';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { popularBanco } from '../../prisma/seed-data';

async function login(usuario: string, senha: string) {
  const res = await request(app).post('/api/auth/login').send({ usuario, senha });
  expect(res.status).toBe(200);
  return `Bearer ${res.body.token}`;
}

let tokenMaria: string;
let tokenJoao: string;
let tokenAtendente: string;
/** id das categorias do seed, por nome */
const cat: Record<string, number> = {};

beforeAll(async () => {
  await popularBanco(prisma);
  for (const c of await prisma.categoria.findMany()) cat[c.nome] = c.id;
  [tokenMaria, tokenJoao, tokenAtendente] = await Promise.all([
    login('maria', 'maria123'),
    login('joao', 'joao123'),
    login('atendente', 'atendente123'),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Autenticação', () => {
  it('faz login e retorna token e dados públicos do usuário', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'maria', senha: 'maria123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).toEqual({ id: expect.any(Number), nome: 'Maria Silva', usuario: 'maria', perfil: 'SOLICITANTE', corAvatar: 'rose' });
    expect(res.body.usuario).not.toHaveProperty('senhaHash');
  });

  it.each([
    ['senha errada', { usuario: 'maria', senha: 'errada' }],
    ['usuário inexistente', { usuario: 'fantasma', senha: 'qualquer' }],
  ])('responde 401 com mensagem genérica para %s', async (_caso, corpo) => {
    const res = await request(app).post('/api/auth/login').send(corpo);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Usuário ou senha inválidos');
  });

  it('responde 400 quando faltam campos', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { campo: string }) => d.campo)).toEqual(['usuario', 'senha']);
  });

  it('bloqueia rotas protegidas sem token ou com token inválido', async () => {
    expect((await request(app).get('/api/solicitacoes')).status).toBe(401);
    expect((await request(app).get('/api/solicitacoes').set('Authorization', 'Bearer xyz')).status).toBe(401);
  });

  it('GET /me retorna o usuário da sessão', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', tokenAtendente);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ usuario: 'atendente', perfil: 'ATENDENTE' });
  });

  it('logout responde 204', async () => {
    const res = await request(app).post('/api/auth/logout').set('Authorization', tokenMaria);
    expect(res.status).toBe(204);
  });
});

describe('Listagem e filtros', () => {
  it('atendente vê todas as solicitações', async () => {
    const res = await request(app).get('/api/solicitacoes?porPagina=100').set('Authorization', tokenAtendente);
    expect(res.status).toBe(200);
    expect(res.body.paginacao.total).toBe(15);
    expect(res.body.dados[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        titulo: expect.any(String),
        categoria: { id: expect.any(Number), nome: expect.any(String) },
        status: expect.any(String),
        criadoEm: expect.any(String),
        solicitante: { id: expect.any(Number), nome: expect.any(String), corAvatar: expect.any(String) },
      }),
    );
  });

  it('solicitante vê apenas as próprias', async () => {
    const res = await request(app).get('/api/solicitacoes?porPagina=100').set('Authorization', tokenMaria);
    expect(res.body.paginacao.total).toBe(8);
    expect(res.body.dados.every((s: { solicitante: { nome: string } }) => s.solicitante.nome === 'Maria Silva')).toBe(true);
  });

  it('ordena da mais recente para a mais antiga', async () => {
    const res = await request(app).get('/api/solicitacoes?porPagina=100').set('Authorization', tokenAtendente);
    const datas = res.body.dados.map((s: { criadoEm: string }) => s.criadoEm);
    expect(datas).toEqual([...datas].sort().reverse());
  });

  it('filtra por status e categoria', async () => {
    const res = await request(app)
      .get(`/api/solicitacoes?status=ABERTO&categoriaId=${cat.TI}`)
      .set('Authorization', tokenAtendente);
    expect(res.body.dados.length).toBeGreaterThan(0);
    expect(res.body.dados.every((s: { status: string; categoria: { nome: string } }) => s.status === 'ABERTO' && s.categoria.nome === 'TI')).toBe(true);
  });

  it('busca por texto no título sem diferenciar maiúsculas', async () => {
    const res = await request(app).get('/api/solicitacoes?q=vpn').set('Authorization', tokenAtendente);
    expect(res.body.dados.map((s: { titulo: string }) => s.titulo)).toEqual(['VPN não conecta em home office']);
  });

  it('filtra por período', async () => {
    const hoje = new Date();
    const dezDiasAtras = new Date(hoje.getTime() - 10 * 24 * 60 * 60 * 1000);
    const iso = (d: Date) => d.toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso local
    const res = await request(app)
      .get(`/api/solicitacoes?porPagina=100&dataInicio=${iso(dezDiasAtras)}&dataFim=${iso(hoje)}`)
      .set('Authorization', tokenAtendente);
    // seed: solicitações com 0 a 10 dias
    expect(res.body.paginacao.total).toBe(10);
  });

  it('pagina os resultados', async () => {
    const res = await request(app).get('/api/solicitacoes?pagina=2&porPagina=10').set('Authorization', tokenAtendente);
    expect(res.body.dados).toHaveLength(5);
    expect(res.body.paginacao).toEqual({ pagina: 2, porPagina: 10, total: 15, totalPaginas: 2 });
  });

  it('valida filtros inválidos', async () => {
    const res = await request(app)
      .get('/api/solicitacoes?status=XYZ&dataInicio=2026-09-30&dataFim=2026-09-01')
      .set('Authorization', tokenAtendente);
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { campo: string }) => d.campo)).toEqual(expect.arrayContaining(['status']));
  });
});

describe('Cadastro, edição e exclusão', () => {
  let id: number;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/solicitacoes')
      .set('Authorization', tokenMaria)
      .send({ titulo: '  Monitor piscando  ', descricao: 'O monitor da estação 5 fica piscando.', categoriaId: cat.TI });
    expect(res.status).toBe(201);
    id = res.body.id;
  });

  it('cria com status Aberto, solicitante da sessão e histórico inicial', async () => {
    const res = await request(app).get(`/api/solicitacoes/${id}`).set('Authorization', tokenMaria);
    expect(res.body).toMatchObject({
      titulo: 'Monitor piscando',
      status: 'ABERTO',
      solicitante: { nome: 'Maria Silva' },
      historico: [{ statusAnterior: null, statusNovo: 'ABERTO', alteradoPor: { nome: 'Maria Silva' } }],
    });
  });

  it('ignora campos automáticos enviados pelo cliente', async () => {
    const res = await request(app)
      .post('/api/solicitacoes')
      .set('Authorization', tokenMaria)
      .send({ titulo: 'Tentativa', descricao: 'Tentando forçar status e dono.', categoriaId: cat.RH, status: 'CONCLUIDO', solicitanteId: 999 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ABERTO');
    expect(res.body.solicitante.nome).toBe('Maria Silva');
  });

  it('valida os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/solicitacoes')
      .set('Authorization', tokenMaria)
      .send({ titulo: 'ab', categoriaId: 'MARKETING' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { campo: string }) => d.campo).sort()).toEqual(['categoriaId', 'descricao', 'titulo']);
  });

  it('dono edita solicitação aberta', async () => {
    const res = await request(app)
      .put(`/api/solicitacoes/${id}`)
      .set('Authorization', tokenMaria)
      .send({ titulo: 'Monitor com defeito', descricao: 'O monitor da estação 5 não liga mais.', categoriaId: cat.Infraestrutura });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ titulo: 'Monitor com defeito', categoria: { nome: 'Infraestrutura' } });
  });

  it('outro solicitante não vê, não edita e não exclui', async () => {
    const corpo = { titulo: 'Invasão', descricao: 'Tentando editar o que não é meu.', categoriaId: cat.TI };
    expect((await request(app).get(`/api/solicitacoes/${id}`).set('Authorization', tokenJoao)).status).toBe(403);
    expect((await request(app).put(`/api/solicitacoes/${id}`).set('Authorization', tokenJoao).send(corpo)).status).toBe(403);
    expect((await request(app).delete(`/api/solicitacoes/${id}`).set('Authorization', tokenJoao)).status).toBe(403);
  });

  it('dono exclui solicitação aberta', async () => {
    expect((await request(app).delete(`/api/solicitacoes/${id}`).set('Authorization', tokenMaria)).status).toBe(204);
    expect((await request(app).get(`/api/solicitacoes/${id}`).set('Authorization', tokenMaria)).status).toBe(404);
  });

  it('não permite editar nem excluir depois que o atendimento começa', async () => {
    await request(app).patch(`/api/solicitacoes/${id}/status`).set('Authorization', tokenAtendente).send({ status: 'EM_ATENDIMENTO' });

    const edicao = await request(app)
      .put(`/api/solicitacoes/${id}`)
      .set('Authorization', tokenMaria)
      .send({ titulo: 'Tarde demais', descricao: 'Não deveria ser possível editar.', categoriaId: cat.TI });
    expect(edicao.status).toBe(422);
    expect(edicao.body.error.code).toBe('SOLICITACAO_NAO_ABERTA');

    expect((await request(app).delete(`/api/solicitacoes/${id}`).set('Authorization', tokenMaria)).status).toBe(422);
  });

  it('responde 400 para código inválido e 404 para inexistente', async () => {
    expect((await request(app).get('/api/solicitacoes/abc').set('Authorization', tokenMaria)).status).toBe(400);
    expect((await request(app).get('/api/solicitacoes/999999').set('Authorization', tokenMaria)).status).toBe(404);
  });
});

describe('Alteração de status', () => {
  let id: number;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/solicitacoes')
      .set('Authorization', tokenJoao)
      .send({ titulo: 'Mouse quebrado', descricao: 'O botão esquerdo do mouse parou.', categoriaId: cat.TI });
    id = res.body.id;
  });

  const alterar = (token: string, status: string) =>
    request(app).patch(`/api/solicitacoes/${id}/status`).set('Authorization', token).send({ status });

  it('solicitante não pode alterar status', async () => {
    expect((await alterar(tokenJoao, 'EM_ATENDIMENTO')).status).toBe(403);
  });

  it('atendente percorre o fluxo completo e o histórico é registrado', async () => {
    expect((await alterar(tokenAtendente, 'EM_ATENDIMENTO')).status).toBe(200);
    const res = await alterar(tokenAtendente, 'CONCLUIDO');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONCLUIDO');
    expect(res.body.historico.map((h: { statusNovo: string }) => h.statusNovo)).toEqual(['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO']);
    expect(res.body.historico[2].alteradoPor.nome).toBe('Ana Atendente');
  });

  it('rejeita transição a partir de Concluído', async () => {
    const res = await alterar(tokenAtendente, 'ABERTO');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('TRANSICAO_STATUS_INVALIDA');
  });

  it('valida o status enviado', async () => {
    expect((await alterar(tokenAtendente, 'CANCELADO')).status).toBe(400);
  });
});

describe('Dashboard', () => {
  it('retorna indicadores coerentes com a listagem', async () => {
    const dash = await request(app).get('/api/dashboard').set('Authorization', tokenAtendente);
    expect(dash.status).toBe(200);

    const contar = async (status: string) =>
      (await request(app).get(`/api/solicitacoes?status=${status}`).set('Authorization', tokenAtendente)).body.paginacao.total;

    expect(dash.body).toEqual({
      total: dash.body.abertas + dash.body.emAtendimento + dash.body.concluidas,
      abertas: await contar('ABERTO'),
      emAtendimento: await contar('EM_ATENDIMENTO'),
      concluidas: await contar('CONCLUIDO'),
    });
  });

  it('solicitante vê apenas os próprios números', async () => {
    const atendente = (await request(app).get('/api/dashboard').set('Authorization', tokenAtendente)).body;
    const joao = (await request(app).get('/api/dashboard').set('Authorization', tokenJoao)).body;
    expect(joao.total).toBeLessThan(atendente.total);
  });
});

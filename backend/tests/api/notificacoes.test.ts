/**
 * Testes de integração: responsável pelo atendimento, limite de 3 atendimentos
 * simultâneos por pessoa e notificações (status e comentários).
 * ATENÇÃO: o banco é repopulado com os dados de demonstração antes da execução.
 */
import './banco-de-teste';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { popularBanco } from '../../prisma/seed-data';

async function login(usuario: string, senha: string) {
  const res = await request(app).post('/api/auth/login').send({ usuario, senha });
  expect(res.status).toBe(200);
  return { token: `Bearer ${res.body.token}`, id: res.body.usuario.id as number };
}

type Sessao = Awaited<ReturnType<typeof login>>;
let maria: Sessao;
let joao: Sessao;
let atendente: Sessao;
let gerente: Sessao;

/** Primeira solicitação aberta da Maria. */
async function abertaDaMaria() {
  const res = await request(app).get('/api/solicitacoes?status=ABERTO').set('Authorization', maria.token);
  return res.body.dados[0] as { id: number; titulo: string };
}

const notificacoesDe = (s: Sessao) => request(app).get('/api/notificacoes').set('Authorization', s.token);

beforeAll(async () => {
  await popularBanco(prisma);
  [maria, joao, atendente, gerente] = await Promise.all([
    login('maria', 'maria123'),
    login('joao', 'joao123'),
    login('atendente', 'atendente123'),
    login('gerente', 'gerente123'),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Responsável e limite de atendimentos', () => {
  it('a atendente do seed já está no limite de 3 e não pode iniciar outro', async () => {
    const { id } = await abertaDaMaria();
    const res = await request(app)
      .patch(`/api/solicitacoes/${id}/status`)
      .set('Authorization', atendente.token)
      .send({ status: 'EM_ATENDIMENTO' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('LIMITE_EM_ATENDIMENTO');
  });

  it('quem inicia o atendimento vira o responsável', async () => {
    const { id } = await abertaDaMaria();
    const res = await request(app)
      .patch(`/api/solicitacoes/${id}/status`)
      .set('Authorization', gerente.token)
      .send({ status: 'EM_ATENDIMENTO' });
    expect(res.status).toBe(200);
    expect(res.body.responsavel).toMatchObject({ id: gerente.id, nome: 'Gabriel Gerente' });
  });

  it('filtra a listagem pelo responsável', async () => {
    const res = await request(app)
      .get(`/api/solicitacoes?status=EM_ATENDIMENTO&responsavelId=${gerente.id}`)
      .set('Authorization', gerente.token);
    expect(res.body.paginacao.total).toBe(2);
    expect(res.body.dados.every((s: { responsavel: { id: number } }) => s.responsavel.id === gerente.id)).toBe(true);
  });

  it('concluir libera vaga para um novo atendimento', async () => {
    const emAndamento = await request(app)
      .get(`/api/solicitacoes?status=EM_ATENDIMENTO&responsavelId=${atendente.id}`)
      .set('Authorization', atendente.token);
    await request(app)
      .patch(`/api/solicitacoes/${emAndamento.body.dados[0].id}/status`)
      .set('Authorization', atendente.token)
      .send({ status: 'CONCLUIDO' });

    const { id } = await abertaDaMaria();
    const res = await request(app)
      .patch(`/api/solicitacoes/${id}/status`)
      .set('Authorization', atendente.token)
      .send({ status: 'EM_ATENDIMENTO' });
    expect(res.status).toBe(200);
  });
});

describe('Notificações', () => {
  it('cada usuário vê só as próprias, com contador de não lidas', async () => {
    const res = await notificacoesDe(joao);
    expect(res.status).toBe(200);
    expect(res.body.naoLidas).toBe(res.body.itens.filter((n: { lida: boolean }) => !n.lida).length);
    expect(res.body.itens[0]).toMatchObject({ autor: { nome: expect.any(String) }, solicitacaoId: expect.any(Number) });
  });

  it('mudança de status notifica o solicitante (e só ele)', async () => {
    await request(app).post('/api/notificacoes/lidas').set('Authorization', maria.token);
    const antesJoao = (await notificacoesDe(joao)).body.naoLidas;
    const { id, titulo } = await abertaDaMaria();

    await request(app).patch(`/api/solicitacoes/${id}/status`).set('Authorization', gerente.token).send({ status: 'EM_ATENDIMENTO' });

    const res = await notificacoesDe(maria);
    expect(res.body.naoLidas).toBe(1);
    expect(res.body.itens[0]).toMatchObject({
      tipo: 'STATUS_ALTERADO',
      lida: false,
      solicitacaoId: id,
      mensagem: expect.stringContaining(titulo),
    });
    expect(res.body.itens[0].mensagem).toContain('Em Atendimento');
    expect((await notificacoesDe(joao)).body.naoLidas).toBe(antesJoao);
    expect((await notificacoesDe(gerente)).body.itens.some((n: { solicitacaoId: number }) => n.solicitacaoId === id)).toBe(false);
  });

  it('comentário notifica solicitante e responsável; nota interna não chega ao solicitante', async () => {
    const res = await request(app)
      .get(`/api/solicitacoes?status=EM_ATENDIMENTO&responsavelId=${gerente.id}`)
      .set('Authorization', maria.token);
    const id = res.body.dados[0].id;
    await request(app).post('/api/notificacoes/lidas').set('Authorization', maria.token);
    await request(app).post('/api/notificacoes/lidas').set('Authorization', gerente.token);

    await request(app).post(`/api/solicitacoes/${id}/comentarios`).set('Authorization', atendente.token).send({ texto: 'Peça encomendada.' });
    expect((await notificacoesDe(maria)).body.itens[0]).toMatchObject({ tipo: 'NOVO_COMENTARIO', lida: false, solicitacaoId: id });
    expect((await notificacoesDe(gerente)).body.naoLidas).toBe(1);

    await request(app)
      .post(`/api/solicitacoes/${id}/comentarios`)
      .set('Authorization', atendente.token)
      .send({ texto: 'Fornecedor atrasado.', interno: true });
    expect((await notificacoesDe(maria)).body.naoLidas).toBe(1); // continua só a do comentário público
    expect((await notificacoesDe(gerente)).body.naoLidas).toBe(2);
  });

  it('quem comenta não notifica a si mesmo', async () => {
    const { body } = await request(app).get('/api/solicitacoes').set('Authorization', maria.token);
    const id = body.dados.find((s: { responsavel: unknown }) => !s.responsavel)?.id ?? body.dados[0].id;
    await request(app).post('/api/notificacoes/lidas').set('Authorization', maria.token);
    await request(app).post(`/api/solicitacoes/${id}/comentarios`).set('Authorization', maria.token).send({ texto: 'Alguma previsão?' });
    expect((await notificacoesDe(maria)).body.naoLidas).toBe(0);
  });

  it('marca uma como lida, mas não a de outra pessoa', async () => {
    const { body } = await notificacoesDe(joao);
    const alvo = body.itens.find((n: { lida: boolean }) => !n.lida);

    expect((await request(app).patch(`/api/notificacoes/${alvo.id}/lida`).set('Authorization', maria.token)).status).toBe(404);
    expect((await request(app).patch(`/api/notificacoes/${alvo.id}/lida`).set('Authorization', joao.token)).status).toBe(204);
    expect((await notificacoesDe(joao)).body.naoLidas).toBe(body.naoLidas - 1);
  });

  it('marca todas como lidas', async () => {
    expect((await request(app).post('/api/notificacoes/lidas').set('Authorization', joao.token)).status).toBe(204);
    expect((await notificacoesDe(joao)).body.naoLidas).toBe(0);
  });

  it('exige autenticação', async () => {
    expect((await request(app).get('/api/notificacoes')).status).toBe(401);
  });
});

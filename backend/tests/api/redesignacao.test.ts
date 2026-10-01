/**
 * Testes de integração: redesignação do responsável por uma solicitação em atendimento.
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
let atendente: Sessao;
let gerente: Sessao;

const redesignar = (s: Sessao, id: number, corpo: object) =>
  request(app).patch(`/api/solicitacoes/${id}/responsavel`).set('Authorization', s.token).send(corpo);

/** Solicitações em atendimento sob responsabilidade de alguém. */
async function emAtendimentoDe(responsavel: Sessao) {
  const res = await request(app)
    .get(`/api/solicitacoes?status=EM_ATENDIMENTO&responsavelId=${responsavel.id}`)
    .set('Authorization', gerente.token);
  return res.body.dados as { id: number; titulo: string; solicitante: { id: number } }[];
}

beforeAll(async () => {
  await popularBanco(prisma);
  [maria, atendente, gerente] = await Promise.all([
    login('maria', 'maria123'),
    login('atendente', 'atendente123'),
    login('gerente', 'gerente123'),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Redesignação de responsável', () => {
  it('é exclusiva do gerente', async () => {
    const [alvo] = await emAtendimentoDe(atendente);
    expect((await redesignar(atendente, alvo.id, { responsavelId: gerente.id })).status).toBe(403);
    expect((await redesignar(maria, alvo.id, { responsavelId: gerente.id })).status).toBe(403);
  });

  it('lista a equipe ativa com a carga de cada pessoa', async () => {
    const res = await request(app).get('/api/usuarios/equipe').set('Authorization', gerente.token);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({ nome: 'Ana Atendente', perfil: 'ATENDENTE', emAtendimento: 3 }),
      expect.objectContaining({ nome: 'Gabriel Gerente', perfil: 'GERENTE', emAtendimento: 1 }),
    ]);
    expect((await request(app).get('/api/usuarios/equipe').set('Authorization', atendente.token)).status).toBe(403);
  });

  it('troca o responsável, registra no histórico e notifica os envolvidos', async () => {
    const [alvo] = await emAtendimentoDe(atendente);
    await Promise.all([atendente, maria].map((s) => request(app).post('/api/notificacoes/lidas').set('Authorization', s.token)));

    const res = await redesignar(gerente, alvo.id, { responsavelId: gerente.id, motivo: '  Ana de férias  ' });
    expect(res.status).toBe(200);
    expect(res.body.responsavel).toMatchObject({ id: gerente.id });
    expect(res.body.redesignacoes).toEqual([
      expect.objectContaining({
        motivo: 'Ana de férias',
        deResponsavel: expect.objectContaining({ nome: 'Ana Atendente' }),
        paraResponsavel: expect.objectContaining({ nome: 'Gabriel Gerente' }),
        redesignadoPor: expect.objectContaining({ nome: 'Gabriel Gerente' }),
      }),
    ]);

    // Avisa o responsável anterior e o solicitante (aqui, quem redesignou é o próprio novo responsável)
    const avisoDe = async (s: Sessao) =>
      (await request(app).get('/api/notificacoes').set('Authorization', s.token)).body.itens.find(
        (n: { tipo: string; solicitacaoId: number }) => n.tipo === 'REDESIGNADA' && n.solicitacaoId === alvo.id,
      );
    expect(await avisoDe(atendente)).toMatchObject({ lida: false, mensagem: expect.stringContaining('de Ana Atendente para Gabriel Gerente') });
    if (alvo.solicitante.id === maria.id) expect(await avisoDe(maria)).toBeTruthy();
    expect(await avisoDe(gerente)).toBeUndefined();

    expect(await emAtendimentoDe(atendente)).toHaveLength(2);
  });

  it('recusa quem não é da equipe e o próprio responsável atual', async () => {
    const [alvo] = await emAtendimentoDe(atendente);
    const paraSolicitante = await redesignar(gerente, alvo.id, { responsavelId: maria.id });
    expect(paraSolicitante.status).toBe(422);
    expect(paraSolicitante.body.error.code).toBe('RESPONSAVEL_INVALIDO');

    const paraOMesmo = await redesignar(gerente, alvo.id, { responsavelId: atendente.id });
    expect(paraOMesmo.body.error.code).toBe('MESMO_RESPONSAVEL');
  });

  it('respeita o limite de 3 atendimentos de quem vai receber', async () => {
    // O gerente já tem 2; inicia mais um e chega a 3
    const abertas = await request(app).get('/api/solicitacoes?status=ABERTO').set('Authorization', gerente.token);
    await request(app)
      .patch(`/api/solicitacoes/${abertas.body.dados[0].id}/status`)
      .set('Authorization', gerente.token)
      .send({ status: 'EM_ATENDIMENTO' });

    const [alvo] = await emAtendimentoDe(atendente);
    const res = await redesignar(gerente, alvo.id, { responsavelId: gerente.id });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('LIMITE_EM_ATENDIMENTO');
  });

  it('só vale para solicitações em atendimento', async () => {
    const abertas = await request(app).get('/api/solicitacoes?status=ABERTO').set('Authorization', gerente.token);
    const res = await redesignar(gerente, abertas.body.dados[0].id, { responsavelId: atendente.id });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('REDESIGNACAO_INVALIDA');
  });

  it('valida o corpo da requisição', async () => {
    const [alvo] = await emAtendimentoDe(atendente);
    const res = await redesignar(gerente, alvo.id, { motivo: 'x'.repeat(301) });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { campo: string }) => d.campo).sort()).toEqual(['motivo', 'responsavelId']);
  });
});

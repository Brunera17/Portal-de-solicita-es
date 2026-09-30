/**
 * Testes de integração das funcionalidades de gerência: perfil GERENTE, categorias,
 * gestão de usuários, comentários (públicos e internos) e "meu perfil".
 * ATENÇÃO: o banco é repopulado com os dados de demonstração antes da execução.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { popularBanco } from '../../prisma/seed-data';

async function login(usuario: string, senha: string) {
  const res = await request(app).post('/api/auth/login').send({ usuario, senha });
  expect(res.status).toBe(200);
  return `Bearer ${res.body.token}`;
}

const sufixo = Date.now().toString(36);
const cat: Record<string, number> = {};
let tokenMaria: string;
let tokenJoao: string;
let tokenAtendente: string;
let tokenGerente: string;

beforeAll(async () => {
  await popularBanco(prisma);
  for (const c of await prisma.categoria.findMany()) cat[c.nome] = c.id;
  [tokenMaria, tokenJoao, tokenAtendente, tokenGerente] = await Promise.all([
    login('maria', 'maria123'),
    login('joao', 'joao123'),
    login('atendente', 'atendente123'),
    login('gerente', 'gerente123'),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Perfil gerente', () => {
  it('vê todas as solicitações e altera status como a equipe', async () => {
    const lista = await request(app).get('/api/solicitacoes?status=ABERTO').set('Authorization', tokenGerente);
    expect(lista.body.paginacao.total).toBeGreaterThan(0);

    const id = lista.body.dados[0].id;
    const res = await request(app)
      .patch(`/api/solicitacoes/${id}/status`)
      .set('Authorization', tokenGerente)
      .send({ status: 'EM_ATENDIMENTO' });
    expect(res.status).toBe(200);
    expect(res.body.historico.at(-1).alteradoPor.nome).toBe('Gabriel Gerente');
  });
});

describe('Categorias', () => {
  it('não gerentes veem apenas categorias ativas, sem estatísticas', async () => {
    const res = await request(app).get('/api/categorias').set('Authorization', tokenMaria);
    expect(res.status).toBe(200);
    expect(res.body.map((c: { nome: string }) => c.nome)).toEqual(['Compras', 'Financeiro', 'Infraestrutura', 'RH', 'TI']);
    expect(res.body[0]).not.toHaveProperty('_count');
  });

  it('gerente vê o total de solicitações por categoria', async () => {
    const res = await request(app).get('/api/categorias').set('Authorization', tokenGerente);
    expect(res.body.find((c: { nome: string }) => c.nome === 'TI')._count.solicitacoes).toBe(4);
  });

  it('apenas o gerente cria, edita e exclui', async () => {
    expect((await request(app).post('/api/categorias').set('Authorization', tokenAtendente).send({ nome: 'X' + sufixo })).status).toBe(403);
    expect((await request(app).patch(`/api/categorias/${cat.TI}`).set('Authorization', tokenMaria).send({ ativa: false })).status).toBe(403);
    expect((await request(app).delete(`/api/categorias/${cat.TI}`).set('Authorization', tokenAtendente)).status).toBe(403);
  });

  it('cria categoria e recusa nome duplicado com 409', async () => {
    const nome = `Jurídico ${sufixo}`;
    const criada = await request(app).post('/api/categorias').set('Authorization', tokenGerente).send({ nome });
    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ nome, ativa: true });

    const repetida = await request(app).post('/api/categorias').set('Authorization', tokenGerente).send({ nome });
    expect(repetida.status).toBe(409);
    expect(repetida.body.error.details).toEqual([{ campo: 'nome', mensagem: 'Este valor já está em uso' }]);
  });

  it('categoria desativada some das opções e não aceita novas solicitações', async () => {
    const { body: nova } = await request(app)
      .post('/api/categorias')
      .set('Authorization', tokenGerente)
      .send({ nome: `Temporária ${sufixo}` });
    await request(app).patch(`/api/categorias/${nova.id}`).set('Authorization', tokenGerente).send({ ativa: false });

    const opcoes = await request(app).get('/api/categorias').set('Authorization', tokenMaria);
    expect(opcoes.body.map((c: { id: number }) => c.id)).not.toContain(nova.id);

    const res = await request(app)
      .post('/api/solicitacoes')
      .set('Authorization', tokenMaria)
      .send({ titulo: 'Teste', descricao: 'Usando categoria desativada.', categoriaId: nova.id });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CATEGORIA_INATIVA');
  });

  it('não exclui categoria em uso, mas exclui categoria sem solicitações', async () => {
    const emUso = await request(app).delete(`/api/categorias/${cat.TI}`).set('Authorization', tokenGerente);
    expect(emUso.status).toBe(409);
    expect(emUso.body.error.code).toBe('CATEGORIA_EM_USO');

    const { body: vazia } = await request(app)
      .post('/api/categorias')
      .set('Authorization', tokenGerente)
      .send({ nome: `Descartável ${sufixo}` });
    expect((await request(app).delete(`/api/categorias/${vazia.id}`).set('Authorization', tokenGerente)).status).toBe(204);
  });
});

describe('Gestão de usuários', () => {
  const novo = { nome: 'Carlos Novo', usuario: `carlos.${sufixo}`, senha: 'carlos123', perfil: 'ATENDENTE' };
  let novoId: number;

  it('é exclusiva do gerente', async () => {
    expect((await request(app).get('/api/usuarios').set('Authorization', tokenAtendente)).status).toBe(403);
    expect((await request(app).get('/api/usuarios').set('Authorization', tokenMaria)).status).toBe(403);
  });

  it('lista usuários sem expor a senha', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', tokenGerente);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(res.body[0]).not.toHaveProperty('senhaHash');
  });

  it('cria um atendente que já consegue entrar e ver todas as solicitações', async () => {
    const res = await request(app).post('/api/usuarios').set('Authorization', tokenGerente).send(novo);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ usuario: novo.usuario, perfil: 'ATENDENTE', ativo: true });
    novoId = res.body.id;

    const token = await login(novo.usuario, novo.senha);
    const lista = await request(app).get('/api/solicitacoes').set('Authorization', token);
    expect(lista.body.paginacao.total).toBe(15);
  });

  it('recusa nome de usuário repetido e dados inválidos', async () => {
    const repetido = await request(app).post('/api/usuarios').set('Authorization', tokenGerente).send(novo);
    expect(repetido.status).toBe(409);

    const invalido = await request(app)
      .post('/api/usuarios')
      .set('Authorization', tokenGerente)
      .send({ nome: 'X', usuario: 'Com Espaço', senha: '123', perfil: 'ADMIN' });
    expect(invalido.status).toBe(400);
    expect(invalido.body.error.details.map((d: { campo: string }) => d.campo).sort()).toEqual(['nome', 'perfil', 'senha', 'usuario']);
  });

  it('mudança de perfil vale imediatamente, sem novo login', async () => {
    const token = await login(novo.usuario, novo.senha);
    await request(app).patch(`/api/usuarios/${novoId}`).set('Authorization', tokenGerente).send({ perfil: 'SOLICITANTE' });

    const lista = await request(app).get('/api/solicitacoes').set('Authorization', token);
    expect(lista.body.paginacao.total).toBe(0); // agora só vê as próprias
  });

  it('usuário desativado perde o acesso na hora e não consegue entrar', async () => {
    const token = await login(novo.usuario, novo.senha);
    await request(app).patch(`/api/usuarios/${novoId}`).set('Authorization', tokenGerente).send({ ativo: false });

    expect((await request(app).get('/api/auth/me').set('Authorization', token)).status).toBe(401);
    const res = await request(app).post('/api/auth/login').send({ usuario: novo.usuario, senha: novo.senha });
    expect(res.status).toBe(401);
  });

  it('gerente redefine a senha de um usuário', async () => {
    await request(app).patch(`/api/usuarios/${novoId}`).set('Authorization', tokenGerente).send({ ativo: true });
    const res = await request(app).put(`/api/usuarios/${novoId}/senha`).set('Authorization', tokenGerente).send({ senha: 'nova-senha' });
    expect(res.status).toBe(204);
    await login(novo.usuario, 'nova-senha');
  });

  it('gerente não pode se desativar nem rebaixar o próprio perfil', async () => {
    const eu = (await request(app).get('/api/auth/me').set('Authorization', tokenGerente)).body;
    for (const dados of [{ ativo: false }, { perfil: 'ATENDENTE' }]) {
      const res = await request(app).patch(`/api/usuarios/${eu.id}`).set('Authorization', tokenGerente).send(dados);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('AUTO_ALTERACAO');
    }
  });
});

describe('Comentários', () => {
  let idJoao: number;

  beforeAll(async () => {
    const res = await request(app).get('/api/solicitacoes?q=sistema financeiro').set('Authorization', tokenJoao);
    idJoao = res.body.dados[0].id;
  });

  const url = () => `/api/solicitacoes/${idJoao}/comentarios`;

  it('solicitante não vê notas internas; a equipe vê tudo', async () => {
    const doDono = await request(app).get(url()).set('Authorization', tokenJoao);
    expect(doDono.status).toBe(200);
    expect(doDono.body).toHaveLength(2);
    expect(doDono.body.every((c: { interno: boolean }) => !c.interno)).toBe(true);

    const daEquipe = await request(app).get(url()).set('Authorization', tokenAtendente);
    expect(daEquipe.body).toHaveLength(3);
    expect(daEquipe.body[0]).toMatchObject({ autor: { nome: 'Ana Atendente', perfil: 'ATENDENTE' } });
  });

  it('quem não vê a solicitação também não vê nem comenta', async () => {
    expect((await request(app).get(url()).set('Authorization', tokenMaria)).status).toBe(403);
    expect((await request(app).post(url()).set('Authorization', tokenMaria).send({ texto: 'Oi' })).status).toBe(403);
  });

  it('solicitante comenta, mas não pode criar nota interna', async () => {
    const publico = await request(app).post(url()).set('Authorization', tokenJoao).send({ texto: '  Alguma novidade?  ' });
    expect(publico.status).toBe(201);
    expect(publico.body).toMatchObject({ texto: 'Alguma novidade?', interno: false, autor: { nome: 'João Souza' } });

    const interno = await request(app).post(url()).set('Authorization', tokenJoao).send({ texto: 'Secreto', interno: true });
    expect(interno.status).toBe(403);
  });

  it('nota interna da equipe fica oculta para o solicitante', async () => {
    const res = await request(app)
      .post(url())
      .set('Authorization', tokenGerente)
      .send({ texto: 'Escalar para o fornecedor se passar de amanhã.', interno: true });
    expect(res.status).toBe(201);

    const doDono = await request(app).get(url()).set('Authorization', tokenJoao);
    expect(doDono.body.map((c: { id: number }) => c.id)).not.toContain(res.body.id);
  });

  it('valida o texto', async () => {
    const res = await request(app).post(url()).set('Authorization', tokenJoao).send({ texto: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('Meu perfil', () => {
  it('atualiza nome e cor do avatar', async () => {
    const res = await request(app)
      .patch('/api/perfil')
      .set('Authorization', tokenJoao)
      .send({ nome: 'João P. Souza', corAvatar: 'emerald' });
    expect(res.status).toBe(200);

    const me = await request(app).get('/api/auth/me').set('Authorization', tokenJoao);
    expect(me.body).toMatchObject({ nome: 'João P. Souza', corAvatar: 'emerald' });
  });

  it('recusa cor fora da paleta e corpo vazio', async () => {
    expect((await request(app).patch('/api/perfil').set('Authorization', tokenJoao).send({ corAvatar: '#ff0000' })).status).toBe(400);
    expect((await request(app).patch('/api/perfil').set('Authorization', tokenJoao).send({})).status).toBe(400);
  });

  it('troca a senha exigindo a senha atual', async () => {
    const errada = await request(app)
      .put('/api/perfil/senha')
      .set('Authorization', tokenJoao)
      .send({ senhaAtual: 'errada', novaSenha: 'joao456' });
    expect(errada.status).toBe(401);

    const certa = await request(app)
      .put('/api/perfil/senha')
      .set('Authorization', tokenJoao)
      .send({ senhaAtual: 'joao123', novaSenha: 'joao456' });
    expect(certa.status).toBe(204);
    await login('joao', 'joao456');
  });
});

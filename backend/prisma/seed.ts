/**
 * Popula o banco com usuários e solicitações de demonstração.
 * Idempotente: pode ser executado várias vezes (recria as solicitações).
 */
import { PrismaClient, Categoria, Perfil, StatusSolicitacao } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const usuarios = [
  { nome: 'Ana Atendente', usuario: 'atendente', senha: 'atendente123', perfil: Perfil.ATENDENTE },
  { nome: 'Maria Silva', usuario: 'maria', senha: 'maria123', perfil: Perfil.SOLICITANTE },
  { nome: 'João Souza', usuario: 'joao', senha: 'joao123', perfil: Perfil.SOLICITANTE },
];

type SolicitacaoSeed = {
  titulo: string;
  descricao: string;
  categoria: Categoria;
  status: StatusSolicitacao;
  solicitante: string;
  diasAtras: number;
};

const solicitacoes: SolicitacaoSeed[] = [
  { titulo: 'Notebook não liga', descricao: 'O notebook do setor comercial não liga desde ontem, mesmo conectado à tomada.', categoria: Categoria.TI, status: StatusSolicitacao.ABERTO, solicitante: 'maria', diasAtras: 1 },
  { titulo: 'Acesso ao sistema financeiro', descricao: 'Preciso de acesso de leitura ao módulo de contas a pagar.', categoria: Categoria.TI, status: StatusSolicitacao.EM_ATENDIMENTO, solicitante: 'joao', diasAtras: 3 },
  { titulo: 'Declaração de vínculo empregatício', descricao: 'Solicito declaração de vínculo para apresentar ao banco.', categoria: Categoria.RH, status: StatusSolicitacao.CONCLUIDO, solicitante: 'maria', diasAtras: 20 },
  { titulo: 'Compra de cadeiras ergonômicas', descricao: 'O setor de atendimento precisa de 4 cadeiras ergonômicas novas.', categoria: Categoria.COMPRAS, status: StatusSolicitacao.ABERTO, solicitante: 'joao', diasAtras: 2 },
  { titulo: 'Reembolso de despesas de viagem', descricao: 'Reembolso referente à visita ao cliente em Campina Grande.', categoria: Categoria.FINANCEIRO, status: StatusSolicitacao.EM_ATENDIMENTO, solicitante: 'maria', diasAtras: 7 },
  { titulo: 'Ar-condicionado da sala 3 com vazamento', descricao: 'O aparelho está pingando água sobre as mesas.', categoria: Categoria.INFRAESTRUTURA, status: StatusSolicitacao.ABERTO, solicitante: 'joao', diasAtras: 0 },
  { titulo: 'Instalação do pacote Office', descricao: 'Novo colaborador precisa do Office instalado na estação 12.', categoria: Categoria.TI, status: StatusSolicitacao.CONCLUIDO, solicitante: 'joao', diasAtras: 35 },
  { titulo: 'Férias de dezembro', descricao: 'Gostaria de confirmar o período de férias de 15/12 a 30/12.', categoria: Categoria.RH, status: StatusSolicitacao.ABERTO, solicitante: 'maria', diasAtras: 4 },
  { titulo: 'Cotação de toners para impressora', descricao: 'Estoque de toner da impressora do 2º andar acabando.', categoria: Categoria.COMPRAS, status: StatusSolicitacao.CONCLUIDO, solicitante: 'maria', diasAtras: 45 },
  { titulo: 'Segunda via de nota fiscal', descricao: 'Fornecedor solicitou segunda via da NF 4512.', categoria: Categoria.FINANCEIRO, status: StatusSolicitacao.ABERTO, solicitante: 'joao', diasAtras: 5 },
  { titulo: 'Lâmpadas queimadas no corredor', descricao: 'Três lâmpadas queimadas no corredor de acesso ao estoque.', categoria: Categoria.INFRAESTRUTURA, status: StatusSolicitacao.EM_ATENDIMENTO, solicitante: 'maria', diasAtras: 6 },
  { titulo: 'VPN não conecta em home office', descricao: 'Erro de autenticação ao conectar na VPN a partir de casa.', categoria: Categoria.TI, status: StatusSolicitacao.ABERTO, solicitante: 'maria', diasAtras: 1 },
  { titulo: 'Atualização de dados bancários', descricao: 'Troquei de banco e preciso atualizar a conta para o salário.', categoria: Categoria.RH, status: StatusSolicitacao.EM_ATENDIMENTO, solicitante: 'joao', diasAtras: 10 },
  { titulo: 'Troca da fechadura da sala de reuniões', descricao: 'A fechadura está emperrando e a chave quase quebrou.', categoria: Categoria.INFRAESTRUTURA, status: StatusSolicitacao.CONCLUIDO, solicitante: 'joao', diasAtras: 28 },
  { titulo: 'Aprovação de orçamento de treinamento', descricao: 'Orçamento para curso de Excel avançado para a equipe financeira.', categoria: Categoria.FINANCEIRO, status: StatusSolicitacao.CONCLUIDO, solicitante: 'maria', diasAtras: 60 },
];

const DIA_MS = 24 * 60 * 60 * 1000;

/** Caminho de status percorrido até chegar ao status final. */
function caminhoAte(status: StatusSolicitacao): StatusSolicitacao[] {
  const ordem = [StatusSolicitacao.ABERTO, StatusSolicitacao.EM_ATENDIMENTO, StatusSolicitacao.CONCLUIDO];
  return ordem.slice(0, ordem.indexOf(status) + 1);
}

async function main() {
  const idsPorUsuario = new Map<string, number>();

  for (const u of usuarios) {
    const senhaHash = await bcrypt.hash(u.senha, 10);
    const salvo = await prisma.usuario.upsert({
      where: { usuario: u.usuario },
      update: { nome: u.nome, senhaHash, perfil: u.perfil, ativo: true },
      create: { nome: u.nome, usuario: u.usuario, senhaHash, perfil: u.perfil },
    });
    idsPorUsuario.set(u.usuario, salvo.id);
  }

  const atendenteId = idsPorUsuario.get('atendente')!;

  await prisma.historicoStatus.deleteMany();
  await prisma.solicitacao.deleteMany();
  await prisma.$executeRawUnsafe('ALTER SEQUENCE solicitacoes_id_seq RESTART WITH 1');

  // Da mais antiga para a mais recente, para que o código acompanhe a data de abertura
  const ordenadas = [...solicitacoes].sort((a, b) => b.diasAtras - a.diasAtras);

  for (const s of ordenadas) {
    const solicitanteId = idsPorUsuario.get(s.solicitante)!;
    const criadoEm = new Date(Date.now() - s.diasAtras * DIA_MS);
    const caminho = caminhoAte(s.status);

    await prisma.solicitacao.create({
      data: {
        titulo: s.titulo,
        descricao: s.descricao,
        categoria: s.categoria,
        status: s.status,
        solicitanteId,
        criadoEm,
        historico: {
          create: caminho.map((status, i) => ({
            statusAnterior: i === 0 ? null : caminho[i - 1],
            statusNovo: status,
            alteradoPorId: i === 0 ? solicitanteId : atendenteId,
            alteradoEm: new Date(criadoEm.getTime() + i * (DIA_MS / 4)),
          })),
        },
      },
    });
  }

  console.log(`Seed concluído: ${usuarios.length} usuários, ${solicitacoes.length} solicitações.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

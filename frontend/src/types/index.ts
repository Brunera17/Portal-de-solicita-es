export const PERFIS = ['SOLICITANTE', 'ATENDENTE'] as const
export type Perfil = (typeof PERFIS)[number]

export const CATEGORIAS = ['TI', 'RH', 'COMPRAS', 'FINANCEIRO', 'INFRAESTRUTURA'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const STATUS = ['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO'] as const
export type Status = (typeof STATUS)[number]

export interface Usuario {
  id: number
  nome: string
  usuario: string
  perfil: Perfil
}

export interface PessoaResumo {
  id: number
  nome: string
}

export interface SolicitacaoResumo {
  id: number
  titulo: string
  categoria: Categoria
  status: Status
  criadoEm: string
  atualizadoEm: string
  solicitante: PessoaResumo
}

export interface HistoricoStatus {
  id: number
  statusAnterior: Status | null
  statusNovo: Status
  alteradoEm: string
  alteradoPor: PessoaResumo
}

export interface SolicitacaoDetalhe extends SolicitacaoResumo {
  descricao: string
  historico: HistoricoStatus[]
}

export interface SolicitacaoInput {
  titulo: string
  descricao: string
  categoria: Categoria
}

export interface FiltrosSolicitacao {
  dataInicio?: string
  dataFim?: string
  categoria?: Categoria
  status?: Status
  q?: string
  pagina?: number
  porPagina?: number
}

export interface Paginado<T> {
  dados: T[]
  paginacao: { pagina: number; porPagina: number; total: number; totalPaginas: number }
}

export interface ResumoDashboard {
  total: number
  abertas: number
  emAtendimento: number
  concluidas: number
}

export interface LoginResposta {
  token: string
  usuario: Usuario
}

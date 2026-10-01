export const PERFIS = ['SOLICITANTE', 'ATENDENTE', 'GERENTE'] as const
export type Perfil = (typeof PERFIS)[number]

export const STATUS = ['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO'] as const
export type Status = (typeof STATUS)[number]

export const CORES_AVATAR = ['indigo', 'sky', 'teal', 'emerald', 'amber', 'orange', 'rose', 'violet', 'slate'] as const
export type CorAvatar = (typeof CORES_AVATAR)[number]

export interface Usuario {
  id: number
  nome: string
  usuario: string
  perfil: Perfil
  corAvatar: CorAvatar
}

/** Visão administrativa (gerente) de um usuário. */
export interface UsuarioAdmin extends Usuario {
  ativo: boolean
  criadoEm: string
  _count: { solicitacoes: number }
}

export interface PessoaResumo {
  id: number
  nome: string
  corAvatar: CorAvatar
}

export interface CategoriaResumo {
  id: number
  nome: string
}

export interface Categoria extends CategoriaResumo {
  ativa: boolean
  /** Presente apenas na listagem do gerente. */
  _count?: { solicitacoes: number }
}

export interface SolicitacaoResumo {
  id: number
  titulo: string
  categoria: CategoriaResumo
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

export interface Comentario {
  id: number
  texto: string
  interno: boolean
  criadoEm: string
  autor: PessoaResumo & { perfil: Perfil }
}

export interface SolicitacaoInput {
  titulo: string
  descricao: string
  categoriaId: number
}

export interface FiltrosSolicitacao {
  dataInicio?: string
  dataFim?: string
  categoriaId?: number
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

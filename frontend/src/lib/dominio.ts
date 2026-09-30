import type { Categoria, Perfil, Status } from '@/types'

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  TI: 'TI',
  RH: 'RH',
  COMPRAS: 'Compras',
  FINANCEIRO: 'Financeiro',
  INFRAESTRUTURA: 'Infraestrutura',
}

export const ROTULO_STATUS: Record<Status, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  CONCLUIDO: 'Concluído',
}

export const ROTULO_PERFIL: Record<Perfil, string> = {
  SOLICITANTE: 'Solicitante',
  ATENDENTE: 'Atendente',
}

/** Próximo status permitido e o texto da ação (espelha a regra do backend). */
export const PROXIMA_ACAO: Record<Status, { status: Status; rotulo: string } | null> = {
  ABERTO: { status: 'EM_ATENDIMENTO', rotulo: 'Iniciar atendimento' },
  EM_ATENDIMENTO: { status: 'CONCLUIDO', rotulo: 'Concluir' },
  CONCLUIDO: null,
}

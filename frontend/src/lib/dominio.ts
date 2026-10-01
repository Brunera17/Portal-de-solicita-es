import type { CorAvatar, Perfil, Status } from '@/types'

export const ROTULO_STATUS: Record<Status, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  CONCLUIDO: 'Concluído',
}

export const ROTULO_PERFIL: Record<Perfil, string> = {
  SOLICITANTE: 'Solicitante',
  ATENDENTE: 'Atendente',
  GERENTE: 'Gerente',
}

/** Equipe de atendimento (atendente e gerente): vê todas as solicitações e altera status. */
export const ehEquipe = (perfil: Perfil) => perfil === 'ATENDENTE' || perfil === 'GERENTE'
export const ehGerente = (perfil: Perfil) => perfil === 'GERENTE'

/** Próximo status permitido e o texto da ação (espelha a regra do backend). */
export const PROXIMA_ACAO: Record<Status, { status: Status; rotulo: string } | null> = {
  ABERTO: { status: 'EM_ATENDIMENTO', rotulo: 'Iniciar atendimento' },
  EM_ATENDIMENTO: { status: 'CONCLUIDO', rotulo: 'Concluir' },
  CONCLUIDO: null,
}

/** Classes de fundo/texto de cada cor de avatar (listadas por extenso para o Tailwind gerá-las). */
export const CLASSES_AVATAR: Record<CorAvatar, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  sky: 'bg-sky-100 text-sky-700',
  teal: 'bg-teal-100 text-teal-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-700',
  rose: 'bg-rose-100 text-rose-700',
  violet: 'bg-violet-100 text-violet-700',
  slate: 'bg-slate-200 text-slate-700',
}

export const ROTULO_COR: Record<CorAvatar, string> = {
  indigo: 'Índigo',
  sky: 'Céu',
  teal: 'Turquesa',
  emerald: 'Esmeralda',
  amber: 'Âmbar',
  orange: 'Laranja',
  rose: 'Rosa',
  violet: 'Violeta',
  slate: 'Grafite',
}

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

/**
 * Classes de fundo/texto de cada cor de avatar (listadas por extenso para o Tailwind gerá-las).
 * As chaves são os valores gravados no banco; com a paleta do projeto, indigo = framboesa,
 * sky = ameixa, emerald = oliva e slate = areia (ver ROTULO_COR).
 */
export const CLASSES_AVATAR: Record<CorAvatar, string> = {
  indigo: 'bg-primaria-100 text-primaria-700',
  sky: 'bg-ameixa-100 text-ameixa-700',
  teal: 'bg-teal-100 text-teal-700',
  emerald: 'bg-oliva-100 text-oliva-700',
  amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-700',
  rose: 'bg-rose-100 text-rose-700',
  violet: 'bg-violet-100 text-violet-700',
  slate: 'bg-neutra-200 text-neutra-700',
}

export const ROTULO_COR: Record<CorAvatar, string> = {
  indigo: 'Framboesa',
  sky: 'Ameixa',
  teal: 'Turquesa',
  emerald: 'Oliva',
  amber: 'Âmbar',
  orange: 'Laranja',
  rose: 'Rosa',
  violet: 'Violeta',
  slate: 'Areia',
}

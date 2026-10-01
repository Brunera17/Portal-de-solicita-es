import { cn } from '@/lib/cn'
import { CLASSES_AVATAR } from '@/lib/dominio'
import type { CorAvatar } from '@/types'

const tamanhos = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-16 text-xl',
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

interface Props {
  nome: string
  cor: CorAvatar
  tamanho?: keyof typeof tamanhos
  className?: string
}

/** Avatar com as iniciais do usuário na cor escolhida no perfil. */
export function Avatar({ nome, cor, tamanho = 'md', className }: Props) {
  return (
    <span
      aria-hidden
      title={nome}
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold',
        CLASSES_AVATAR[cor] ?? CLASSES_AVATAR.indigo,
        tamanhos[tamanho],
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  )
}

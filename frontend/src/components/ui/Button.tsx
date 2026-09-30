import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import { classesBotao, type TamanhoBotao, type VarianteBotao } from './botao-estilos'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao
  tamanho?: TamanhoBotao
  carregando?: boolean
}

export function Button({
  variante,
  tamanho,
  carregando = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={classesBotao(variante, tamanho, className)}
      {...props}
    >
      {carregando && <Spinner className="size-4" />}
      {children}
    </button>
  )
}

interface BotaoLinkProps extends LinkProps {
  variante?: VarianteBotao
  tamanho?: TamanhoBotao
}

/** Link de navegação com aparência de botão. */
export function BotaoLink({ variante, tamanho, className, ...props }: BotaoLinkProps) {
  return <Link className={classesBotao(variante, tamanho, className as string | undefined)} {...props} />
}

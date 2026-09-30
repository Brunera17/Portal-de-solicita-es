import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const base =
  'block w-full rounded-lg border bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 ' +
  'focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500'

const estado = (erro?: string) =>
  erro
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'

interface CampoProps {
  id: string
  rotulo: string
  erro?: string
  dica?: string
  children: ReactNode
  className?: string
}

/** Envolve um controle de formulário com rótulo, dica e mensagem de erro acessíveis. */
export function Campo({ id, rotulo, erro, dica, children, className }: CampoProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      {children}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-red-600">
          {erro}
        </p>
      ) : (
        dica && <p className="mt-1.5 text-xs text-slate-500">{dica}</p>
      )}
    </div>
  )
}

type ComErro = { erro?: string }

export function Input({ erro, className, ...props }: InputHTMLAttributes<HTMLInputElement> & ComErro) {
  return (
    <input
      aria-invalid={!!erro}
      aria-describedby={erro && props.id ? `${props.id}-erro` : undefined}
      className={cn(base, 'h-10', estado(erro), className)}
      {...props}
    />
  )
}

export function Select({ erro, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & ComErro) {
  return (
    <select
      aria-invalid={!!erro}
      aria-describedby={erro && props.id ? `${props.id}-erro` : undefined}
      className={cn(base, 'h-10 pr-8', estado(erro), className)}
      {...props}
    />
  )
}

export function Textarea({ erro, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & ComErro) {
  return (
    <textarea
      aria-invalid={!!erro}
      aria-describedby={erro && props.id ? `${props.id}-erro` : undefined}
      className={cn(base, 'min-h-32 py-2', estado(erro), className)}
      {...props}
    />
  )
}

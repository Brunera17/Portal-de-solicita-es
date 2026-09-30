import { useState, type InputHTMLAttributes } from 'react'
import { Input } from './Campo'

/** Data completa (AAAA-MM-DD) e com ano plausível; descarta estados intermediários da digitação. */
function dataCompleta(valor: string) {
  const ano = Number(valor.slice(0, 4))
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && ano >= 1900 && ano <= 2100
}

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  valor: string
  onConfirmar: (valor: string) => void
}

/**
 * Campo de data que só confirma o valor quando ele está completo (ou ao sair do campo).
 * Enquanto o ano é digitado, o navegador emite valores como "0002-09-30"; repassá-los
 * a cada tecla dispararia consultas e sobrescreveria o que o usuário está digitando.
 */
export function CampoData({ valor, onConfirmar, onBlur, ...props }: Props) {
  const [rascunho, setRascunho] = useState(valor)
  const [valorExterno, setValorExterno] = useState(valor)

  // Se o valor mudar por fora (ex.: "Limpar filtros"), o rascunho acompanha
  if (valor !== valorExterno) {
    setValorExterno(valor)
    setRascunho(valor)
  }

  const confirmar = (v: string) => {
    if (v !== valor) onConfirmar(v)
  }

  return (
    <Input
      type="date"
      value={rascunho}
      onChange={(e) => {
        setRascunho(e.target.value)
        if (dataCompleta(e.target.value)) confirmar(e.target.value)
      }}
      onBlur={(e) => {
        confirmar(dataCompleta(rascunho) ? rascunho : '')
        if (!dataCompleta(rascunho)) setRascunho('')
        onBlur?.(e)
      }}
      {...props}
    />
  )
}

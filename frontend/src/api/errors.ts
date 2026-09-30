import { isAxiosError } from 'axios'

export interface ErroCampo {
  campo: string
  mensagem: string
}

interface CorpoErroApi {
  error?: { code?: string; message?: string; details?: unknown }
}

/** Mensagem amigável a partir de qualquer erro (API, rede ou inesperado). */
export function mensagemDeErro(erro: unknown, padrao = 'Ocorreu um erro inesperado. Tente novamente.'): string {
  if (isAxiosError<CorpoErroApi>(erro)) {
    if (!erro.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.'
    }
    return erro.response.data?.error?.message ?? padrao
  }
  return padrao
}

/** Erros de validação por campo devolvidos pela API (HTTP 400). */
export function errosDeCampo(erro: unknown): ErroCampo[] {
  if (isAxiosError<CorpoErroApi>(erro) && erro.response?.status === 400) {
    const details = erro.response.data?.error?.details
    if (Array.isArray(details)) {
      return details as ErroCampo[]
    }
  }
  return []
}

export function statusHttp(erro: unknown): number | undefined {
  return isAxiosError(erro) ? erro.response?.status : undefined
}

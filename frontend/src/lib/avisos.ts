import { toast as sonner, type ExternalToast } from 'sonner'

/** Durações dos avisos. Precisam bater com --duracao-aviso em index.css (barra de tempo). */
export const DURACAO_AVISO_MS = 3500
export const DURACAO_AVISO_LONGO_MS = 5000

type Mensagem = Parameters<typeof sonner.success>[0]

/** Avisos do sistema: alertas e erros ficam mais tempo na tela, pois exigem leitura. */
export const toast = {
  success: (mensagem: Mensagem, opcoes?: ExternalToast) => sonner.success(mensagem, opcoes),
  info: (mensagem: Mensagem, opcoes?: ExternalToast) => sonner.info(mensagem, opcoes),
  warning: (mensagem: Mensagem, opcoes?: ExternalToast) =>
    sonner.warning(mensagem, { duration: DURACAO_AVISO_LONGO_MS, ...opcoes }),
  error: (mensagem: Mensagem, opcoes?: ExternalToast) =>
    sonner.error(mensagem, { duration: DURACAO_AVISO_LONGO_MS, ...opcoes }),
}

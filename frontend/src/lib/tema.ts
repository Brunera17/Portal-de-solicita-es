/** Preferência de tema do usuário. "sistema" acompanha o modo claro/escuro do sistema operacional. */
export type PreferenciaTema = 'claro' | 'escuro' | 'sistema'

const CHAVE = 'portal.tema'
const consultaEscuro = () => window.matchMedia('(prefers-color-scheme: dark)')

export function lerPreferencia(): PreferenciaTema {
  try {
    const salvo = localStorage.getItem(CHAVE)
    return salvo === 'claro' || salvo === 'escuro' ? salvo : 'sistema'
  } catch {
    return 'sistema'
  }
}

export function salvarPreferencia(preferencia: PreferenciaTema) {
  try {
    if (preferencia === 'sistema') localStorage.removeItem(CHAVE)
    else localStorage.setItem(CHAVE, preferencia)
  } catch {
    // armazenamento indisponível (modo privado): o tema vale só nesta sessão
  }
}

export function resolverTema(preferencia: PreferenciaTema): 'claro' | 'escuro' {
  if (preferencia === 'sistema') return consultaEscuro().matches ? 'escuro' : 'claro'
  return preferencia
}

/** Aplica o tema no <html>. O mesmo código roda inline no index.html para evitar o "flash" claro. */
export function aplicarTema(preferencia: PreferenciaTema) {
  document.documentElement.classList.toggle('dark', resolverTema(preferencia) === 'escuro')
}

/** Reaplica quando o sistema troca de modo (só importa se a preferência for "sistema"). */
export function observarSistema(aoMudar: () => void) {
  const mq = consultaEscuro()
  mq.addEventListener('change', aoMudar)
  return () => mq.removeEventListener('change', aoMudar)
}

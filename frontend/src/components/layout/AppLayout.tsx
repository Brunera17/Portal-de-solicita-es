import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { ClipboardList, Columns3, LayoutDashboard, LogOut, Menu, Plus, Settings, X } from 'lucide-react'
import { useAuth, useUsuarioLogado } from '@/hooks/useAuth'
import { useAvisarNovasNotificacoes } from '@/hooks/useNotificacoes'
import { cn } from '@/lib/cn'
import { ehGerente, ROTULO_PERFIL } from '@/lib/dominio'
import { Avatar } from '@/components/ui/Avatar'
import { BotaoLink } from '@/components/ui/Button'
import { NotificacoesSino } from './NotificacoesSino'
import { SeletorTema } from './SeletorTema'

const linksBase = [
  { to: '/', rotulo: 'Dashboard', icone: LayoutDashboard, end: true },
  { to: '/solicitacoes', rotulo: 'Solicitações', icone: ClipboardList, end: false },
  { to: '/quadro', rotulo: 'Quadro', icone: Columns3, end: false },
]
const linkAdmin = { to: '/admin', rotulo: 'Administração', icone: Settings, end: false }

function Marca() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
        <ClipboardList aria-hidden className="size-4" />
      </span>
      <span className="leading-tight">
        Portal de
        <br />
        Solicitações
      </span>
    </Link>
  )
}

/** Conteúdo da barra lateral, compartilhado entre desktop (fixa) e celular (gaveta). */
function ConteudoLateral({ comSino }: { comSino: boolean }) {
  const usuario = useUsuarioLogado()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const links = ehGerente(usuario.perfil) ? [...linksBase, linkAdmin] : linksBase

  const sair = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <Marca />
        {comSino && <NotificacoesSino posicao="lateral" />}
      </div>

      <div className="px-3">
        <BotaoLink to="/solicitacoes/nova" className="w-full">
          <Plus aria-hidden className="size-4" />
          Nova solicitação
        </BotaoLink>
      </div>

      <nav aria-label="Principal" className="mt-5 flex flex-col gap-1 px-3">
        {links.map(({ to, rotulo, icone: Icone, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icone aria-hidden className="size-4.5" />
            {rotulo}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-slate-200 p-3">
        <SeletorTema />
        <div className="flex items-center gap-1">
          <Link to="/perfil" title="Meu perfil" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 hover:bg-slate-100">
            <Avatar nome={usuario.nome} cor={usuario.corAvatar} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium text-slate-800">{usuario.nome}</span>
              <span className="block text-xs text-slate-500">{ROTULO_PERFIL[usuario.perfil]}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={sair}
            aria-label="Sair"
            title="Sair"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600"
          >
            <LogOut aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppLayout() {
  useAvisarNovasNotificacoes()
  const [gavetaAberta, setGavetaAberta] = useState(false)
  const { pathname } = useLocation()

  // Fecha a gaveta ao navegar
  const [rotaAnterior, setRotaAnterior] = useState(pathname)
  if (pathname !== rotaAnterior) {
    setRotaAnterior(pathname)
    setGavetaAberta(false)
  }

  useEffect(() => {
    if (!gavetaAberta) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setGavetaAberta(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [gavetaAberta])

  return (
    <div className="min-h-dvh">
      {/* Desktop: barra lateral fixa */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-surface lg:block">
        <ConteudoLateral comSino />
      </aside>

      {/* Celular/tablet: barra superior + gaveta */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setGavetaAberta(true)}
          aria-label="Abrir menu"
          aria-expanded={gavetaAberta}
          className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu aria-hidden className="size-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <ClipboardList aria-hidden className="size-4" />
          </span>
          Portal de Solicitações
        </Link>
        <NotificacoesSino posicao="abaixo" />
      </header>

      {gavetaAberta && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setGavetaAberta(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-xl">
            <button
              type="button"
              onClick={() => setGavetaAberta(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X aria-hidden className="size-5" />
            </button>
            <ConteudoLateral comSino={false} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

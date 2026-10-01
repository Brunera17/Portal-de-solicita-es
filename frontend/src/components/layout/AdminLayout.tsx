import { NavLink, Outlet } from 'react-router'
import { Tags, Users } from 'lucide-react'
import { cn } from '@/lib/cn'

const abas = [
  { to: '/admin/usuarios', rotulo: 'Usuários', icone: Users },
  { to: '/admin/categorias', rotulo: 'Categorias', icone: Tags },
]

export function AdminLayout() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Administração</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie os usuários do portal e as categorias de solicitação.</p>
      </div>
      <nav aria-label="Administração" className="mb-6 flex gap-1 border-b border-slate-200">
        {abas.map(({ to, rotulo, icone: Icone }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )
            }
          >
            <Icone aria-hidden className="size-4" />
            {rotulo}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  )
}

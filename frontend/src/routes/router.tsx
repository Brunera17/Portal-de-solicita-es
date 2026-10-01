import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { Carregando } from '@/components/ui/Estados'
import { LoginPage } from '@/pages/LoginPage'
import { RotaGerente } from './RotaGerente'
import { RotaPrivada } from './RotaPrivada'

// Páginas internas são carregadas sob demanda (code splitting): o login fica leve
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RotaPrivada />,
    children: [
      {
        element: <AppLayout />,
        hydrateFallbackElement: <Carregando />,
        children: [
          {
            index: true,
            lazy: () => import('@/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
          },
          {
            path: 'solicitacoes',
            lazy: () => import('@/pages/SolicitacoesPage').then((m) => ({ Component: m.SolicitacoesPage })),
          },
          {
            path: 'solicitacoes/nova',
            lazy: () => import('@/pages/SolicitacaoFormPage').then((m) => ({ Component: m.SolicitacaoFormPage })),
          },
          {
            path: 'solicitacoes/:id',
            lazy: () => import('@/pages/SolicitacaoDetalhePage').then((m) => ({ Component: m.SolicitacaoDetalhePage })),
          },
          {
            path: 'solicitacoes/:id/editar',
            lazy: () => import('@/pages/SolicitacaoFormPage').then((m) => ({ Component: m.SolicitacaoFormPage })),
          },
          {
            path: 'quadro',
            lazy: () => import('@/pages/KanbanPage').then((m) => ({ Component: m.KanbanPage })),
          },
          {
            path: 'perfil',
            lazy: () => import('@/pages/PerfilPage').then((m) => ({ Component: m.PerfilPage })),
          },
          {
            path: 'admin',
            element: <RotaGerente />,
            children: [
              {
                lazy: () => import('@/components/layout/AdminLayout').then((m) => ({ Component: m.AdminLayout })),
                children: [
                  { index: true, element: <Navigate to="usuarios" replace /> },
                  {
                    path: 'usuarios',
                    lazy: () => import('@/pages/admin/UsuariosPage').then((m) => ({ Component: m.UsuariosPage })),
                  },
                  {
                    path: 'categorias',
                    lazy: () => import('@/pages/admin/CategoriasPage').then((m) => ({ Component: m.CategoriasPage })),
                  },
                ],
              },
            ],
          },
          {
            path: '*',
            lazy: () => import('@/pages/NaoEncontradaPage').then((m) => ({ Component: m.NaoEncontradaPage })),
          },
        ],
      },
    ],
  },
])

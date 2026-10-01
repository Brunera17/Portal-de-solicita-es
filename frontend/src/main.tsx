import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { statusHttp } from '@/api/errors'
import { Avisos } from '@/components/ui/Avisos'
import { AuthProvider } from '@/contexts/AuthProvider'
import { router } from '@/routes/router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Repetir só faz sentido para falhas transitórias (rede/5xx), não para 4xx
      retry: (tentativas, erro) => {
        const status = statusHttp(erro)
        return tentativas < 2 && (status === undefined || status >= 500)
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Avisos />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)

import { api } from './client'
import type {
  FiltrosSolicitacao,
  LoginResposta,
  Paginado,
  ResumoDashboard,
  SolicitacaoDetalhe,
  SolicitacaoInput,
  SolicitacaoResumo,
  Status,
  Usuario,
} from '@/types'

export const authApi = {
  login: (usuario: string, senha: string) =>
    api.post<LoginResposta>('/auth/login', { usuario, senha }).then((r) => r.data),
  me: () => api.get<Usuario>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout'),
}

export const solicitacoesApi = {
  listar: (filtros: FiltrosSolicitacao) =>
    api.get<Paginado<SolicitacaoResumo>>('/solicitacoes', { params: filtros }).then((r) => r.data),
  obter: (id: number) => api.get<SolicitacaoDetalhe>(`/solicitacoes/${id}`).then((r) => r.data),
  criar: (dados: SolicitacaoInput) => api.post<SolicitacaoDetalhe>('/solicitacoes', dados).then((r) => r.data),
  atualizar: (id: number, dados: SolicitacaoInput) =>
    api.put<SolicitacaoDetalhe>(`/solicitacoes/${id}`, dados).then((r) => r.data),
  excluir: (id: number) => api.delete(`/solicitacoes/${id}`),
  alterarStatus: (id: number, status: Status) =>
    api.patch<SolicitacaoDetalhe>(`/solicitacoes/${id}/status`, { status }).then((r) => r.data),
}

export const dashboardApi = {
  resumo: () => api.get<ResumoDashboard>('/dashboard').then((r) => r.data),
}

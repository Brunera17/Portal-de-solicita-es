import { api } from './client'
import type {
  Categoria,
  Comentario,
  CorAvatar,
  FiltrosSolicitacao,
  LoginResposta,
  Paginado,
  Perfil,
  ResumoDashboard,
  SolicitacaoDetalhe,
  SolicitacaoInput,
  SolicitacaoResumo,
  Status,
  Usuario,
  UsuarioAdmin,
} from '@/types'

export const authApi = {
  login: (usuario: string, senha: string) =>
    api.post<LoginResposta>('/auth/login', { usuario, senha }).then((r) => r.data),
  me: () => api.get<Usuario>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout'),
}

export const perfilApi = {
  atualizar: (dados: { nome?: string; corAvatar?: CorAvatar }) =>
    api.patch<Usuario>('/perfil', dados).then((r) => r.data),
  trocarSenha: (senhaAtual: string, novaSenha: string) => api.put('/perfil/senha', { senhaAtual, novaSenha }),
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

export const comentariosApi = {
  listar: (solicitacaoId: number) =>
    api.get<Comentario[]>(`/solicitacoes/${solicitacaoId}/comentarios`).then((r) => r.data),
  criar: (solicitacaoId: number, dados: { texto: string; interno: boolean }) =>
    api.post<Comentario>(`/solicitacoes/${solicitacaoId}/comentarios`, dados).then((r) => r.data),
}

export const categoriasApi = {
  listar: () => api.get<Categoria[]>('/categorias').then((r) => r.data),
  criar: (nome: string) => api.post<Categoria>('/categorias', { nome }).then((r) => r.data),
  atualizar: (id: number, dados: { nome?: string; ativa?: boolean }) =>
    api.patch<Categoria>(`/categorias/${id}`, dados).then((r) => r.data),
  excluir: (id: number) => api.delete(`/categorias/${id}`),
}

export const usuariosApi = {
  listar: () => api.get<UsuarioAdmin[]>('/usuarios').then((r) => r.data),
  criar: (dados: { nome: string; usuario: string; senha: string; perfil: Perfil }) =>
    api.post<UsuarioAdmin>('/usuarios', dados).then((r) => r.data),
  atualizar: (id: number, dados: { nome?: string; perfil?: Perfil; ativo?: boolean }) =>
    api.patch<UsuarioAdmin>(`/usuarios/${id}`, dados).then((r) => r.data),
  redefinirSenha: (id: number, senha: string) => api.put(`/usuarios/${id}/senha`, { senha }),
}

export const dashboardApi = {
  resumo: () => api.get<ResumoDashboard>('/dashboard').then((r) => r.data),
}

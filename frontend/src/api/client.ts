import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'portal.token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** Disparado quando a API responde 401: o AuthContext escuta e encerra a sessão. */
export const SESSAO_EXPIRADA_EVENT = 'portal:sessao-expirada'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const ehLogin = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !ehLogin) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(SESSAO_EXPIRADA_EVENT))
    }
    return Promise.reject(error)
  },
)

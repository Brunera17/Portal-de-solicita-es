import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, ClipboardList } from 'lucide-react'
import { mensagemDeErro } from '@/api/errors'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Campo, Input } from '@/components/ui/Campo'
import { Carregando } from '@/components/ui/Estados'

const schema = z.object({
  usuario: z.string().trim().min(1, 'Informe o usuário'),
  senha: z.string().min(1, 'Informe a senha'),
})
type FormLogin = z.infer<typeof schema>

// Painel de credenciais de teste; desligue com VITE_EXIBIR_USUARIOS_DEMO=false
const exibirUsuariosDemo = import.meta.env.VITE_EXIBIR_USUARIOS_DEMO !== 'false'
const usuariosDemo = [
  { usuario: 'gerente', senha: 'gerente123', perfil: 'Gerente' },
  { usuario: 'atendente', senha: 'atendente123', perfil: 'Atendente' },
  { usuario: 'maria', senha: 'maria123', perfil: 'Solicitante' },
  { usuario: 'joao', senha: 'joao123', perfil: 'Solicitante' },
]

export function LoginPage() {
  const { usuario, carregando, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [erroLogin, setErroLogin] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormLogin>({ resolver: zodResolver(schema) })

  if (carregando) return <Carregando texto="Verificando sessão..." />

  const destino = (location.state as { de?: string } | null)?.de ?? '/'
  if (usuario) return <Navigate to={destino} replace />

  const entrar = async (dados: FormLogin) => {
    setErroLogin(null)
    try {
      await login(dados.usuario, dados.senha)
      navigate(destino, { replace: true })
    } catch (erro) {
      setErroLogin(mensagemDeErro(erro, 'Não foi possível entrar. Tente novamente.'))
    }
  }

  const preencher = (u: (typeof usuariosDemo)[number]) => {
    setValue('usuario', u.usuario, { shouldValidate: true })
    setValue('senha', u.senha, { shouldValidate: true })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <ClipboardList aria-hidden className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Portal de Solicitações</h1>
          <p className="mt-1 text-sm text-slate-500">Entre para registrar e acompanhar suas demandas</p>
        </div>

        <form
          onSubmit={handleSubmit(entrar)}
          noValidate
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {erroLogin && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              {erroLogin}
            </div>
          )}

          <Campo id="usuario" rotulo="Usuário" erro={errors.usuario?.message}>
            <Input id="usuario" autoComplete="username" autoFocus erro={errors.usuario?.message} {...register('usuario')} />
          </Campo>

          <Campo id="senha" rotulo="Senha" erro={errors.senha?.message}>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              erro={errors.senha?.message}
              {...register('senha')}
            />
          </Campo>

          <Button type="submit" className="w-full" carregando={isSubmitting}>
            Entrar
          </Button>
        </form>

        {exibirUsuariosDemo && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Usuários de demonstração</p>
            <ul className="mt-2 space-y-1">
              {usuariosDemo.map((u) => (
                <li key={u.usuario}>
                  <button
                    type="button"
                    onClick={() => preencher(u)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                  >
                    <span>
                      <span className="font-mono text-slate-800">{u.usuario}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="font-mono text-slate-600">{u.senha}</span>
                    </span>
                    <span className="text-xs text-slate-500">{u.perfil}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

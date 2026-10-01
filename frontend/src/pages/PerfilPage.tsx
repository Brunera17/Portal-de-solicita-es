import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { errosDeCampo, mensagemDeErro } from '@/api/errors'
import { perfilApi } from '@/api/endpoints'
import { useAuth, useUsuarioLogado } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { CLASSES_AVATAR, ROTULO_COR, ROTULO_PERFIL } from '@/lib/dominio'
import { CORES_AVATAR, type CorAvatar } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Campo, Input } from '@/components/ui/Campo'
import { Card } from '@/components/ui/Card'

const dadosSchema = z.object({
  nome: z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres').max(100, 'O nome deve ter no máximo 100 caracteres'),
  corAvatar: z.enum(CORES_AVATAR),
})
type Dados = z.infer<typeof dadosSchema>

const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual'),
    novaSenha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(100),
    confirmacao: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmacao, { message: 'As senhas não conferem', path: ['confirmacao'] })
  .refine((d) => d.novaSenha !== d.senhaAtual, { message: 'A nova senha deve ser diferente da atual', path: ['novaSenha'] })
type Senha = z.infer<typeof senhaSchema>

export function PerfilPage() {
  const usuario = useUsuarioLogado()

  return (
    <>
      <CabecalhoPagina titulo="Meu perfil" descricao="Atualize seus dados e sua senha de acesso." />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <FormDados />
        <FormSenha />
      </div>
      <p className="mt-6 text-xs text-slate-500">
        Usuário de acesso: <span className="font-mono">{usuario.usuario}</span> · Perfil: {ROTULO_PERFIL[usuario.perfil]}.
        Para alterar o perfil de acesso, procure um gerente.
      </p>
    </>
  )
}

function FormDados() {
  const usuario = useUsuarioLogado()
  const { atualizarUsuario } = useAuth()
  const salvar = useMutation({ mutationFn: perfilApi.atualizar })

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<Dados>({
    resolver: zodResolver(dadosSchema),
    defaultValues: { nome: usuario.nome, corAvatar: usuario.corAvatar },
  })

  const [nome, cor] = useWatch({ control, name: ['nome', 'corAvatar'] })

  const enviar = async (dados: Dados) => {
    try {
      const atualizado = await salvar.mutateAsync(dados)
      atualizarUsuario(atualizado)
      reset({ nome: atualizado.nome, corAvatar: atualizado.corAvatar })
      toast.success('Perfil atualizado')
    } catch (erro) {
      const porCampo = errosDeCampo(erro)
      if (porCampo.length) porCampo.forEach((c) => setError(c.campo as keyof Dados, { message: c.mensagem }))
      else toast.error(mensagemDeErro(erro))
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5 p-6">
        <h2 className="font-semibold text-slate-900">Dados pessoais</h2>

        <div className="flex items-center gap-4">
          <Avatar nome={nome || usuario.nome} cor={cor} tamanho="lg" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{nome || usuario.nome}</p>
            <p className="text-sm text-slate-500">{ROTULO_PERFIL[usuario.perfil]}</p>
          </div>
        </div>

        <Campo id="perfil-nome" rotulo="Nome" erro={errors.nome?.message}>
          <Input id="perfil-nome" autoComplete="name" erro={errors.nome?.message} {...register('nome')} />
        </Campo>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Cor do avatar</legend>
          <div role="radiogroup" className="flex flex-wrap gap-2">
            {CORES_AVATAR.map((c: CorAvatar) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cor === c}
                aria-label={ROTULO_COR[c]}
                title={ROTULO_COR[c]}
                onClick={() => setValue('corAvatar', c, { shouldDirty: true })}
                className={cn(
                  'grid size-9 place-items-center rounded-full ring-offset-2 transition',
                  CLASSES_AVATAR[c],
                  cor === c ? 'ring-2 ring-indigo-500' : 'hover:ring-2 hover:ring-slate-300',
                )}
              >
                {cor === c && <Check aria-hidden className="size-4" />}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <Button type="submit" carregando={salvar.isPending} disabled={!isDirty}>
            Salvar dados
          </Button>
        </div>
      </form>
    </Card>
  )
}

function FormSenha() {
  const trocar = useMutation({
    mutationFn: ({ senhaAtual, novaSenha }: Senha) => perfilApi.trocarSenha(senhaAtual, novaSenha),
  })

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Senha>({ resolver: zodResolver(senhaSchema) })

  const enviar = async (dados: Senha) => {
    try {
      await trocar.mutateAsync(dados)
      reset({ senhaAtual: '', novaSenha: '', confirmacao: '' })
      toast.success('Senha alterada')
    } catch (erro) {
      const porCampo = errosDeCampo(erro)
      if (porCampo.length) porCampo.forEach((c) => setError(c.campo as keyof Senha, { message: c.mensagem }))
      else toast.error(mensagemDeErro(erro))
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5 p-6">
        <h2 className="font-semibold text-slate-900">Alterar senha</h2>

        <Campo id="senha-atual" rotulo="Senha atual" erro={errors.senhaAtual?.message}>
          <Input id="senha-atual" type="password" autoComplete="current-password" erro={errors.senhaAtual?.message} {...register('senhaAtual')} />
        </Campo>
        <Campo id="nova-senha" rotulo="Nova senha" erro={errors.novaSenha?.message} dica="Mínimo de 6 caracteres">
          <Input id="nova-senha" type="password" autoComplete="new-password" erro={errors.novaSenha?.message} {...register('novaSenha')} />
        </Campo>
        <Campo id="confirmacao" rotulo="Confirme a nova senha" erro={errors.confirmacao?.message}>
          <Input id="confirmacao" type="password" autoComplete="new-password" erro={errors.confirmacao?.message} {...register('confirmacao')} />
        </Campo>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <Button type="submit" carregando={trocar.isPending}>
            Alterar senha
          </Button>
        </div>
      </form>
    </Card>
  )
}

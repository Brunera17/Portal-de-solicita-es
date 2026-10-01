import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound, Pencil, Plus, UserCheck, UserX } from 'lucide-react'
import { errosDeCampo, mensagemDeErro } from '@/api/errors'
import { useAtualizarUsuario, useCriarUsuario, useRedefinirSenha, useUsuarios } from '@/hooks/useAdmin'
import { useUsuarioLogado } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { ROTULO_PERFIL } from '@/lib/dominio'
import { formatarData } from '@/lib/format'
import { PERFIS, type Perfil, type UsuarioAdmin } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Campo, Input, Select } from '@/components/ui/Campo'
import { Card } from '@/components/ui/Card'
import { DialogoConfirmacao } from '@/components/ui/DialogoConfirmacao'
import { Carregando, ErroCarregamento } from '@/components/ui/Estados'
import { Modal } from '@/components/ui/Modal'

const corPerfil: Record<Perfil, string> = {
  SOLICITANTE: 'bg-slate-100 text-slate-700',
  ATENDENTE: 'bg-sky-50 text-sky-700',
  GERENTE: 'bg-violet-50 text-violet-700',
}

type Dialogo =
  | { tipo: 'novo' }
  | { tipo: 'editar'; usuario: UsuarioAdmin }
  | { tipo: 'senha'; usuario: UsuarioAdmin }
  | { tipo: 'ativacao'; usuario: UsuarioAdmin }
  | null

export function UsuariosPage() {
  const eu = useUsuarioLogado()
  const usuarios = useUsuarios()
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const fechar = () => setDialogo(null)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {usuarios.data ? `${usuarios.data.filter((u) => u.ativo).length} usuários ativos` : ' '}
        </p>
        <Button onClick={() => setDialogo({ tipo: 'novo' })}>
          <Plus aria-hidden className="size-4" />
          Novo usuário
        </Button>
      </div>

      <Card className="overflow-hidden">
        {usuarios.isPending ? (
          <Carregando />
        ) : usuarios.isError ? (
          <ErroCarregamento mensagem={mensagemDeErro(usuarios.error)} onTentarNovamente={() => usuarios.refetch()} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {usuarios.data.map((u) => {
              const souEu = u.id === eu.id
              return (
                <li key={u.id} className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4', !u.ativo && 'bg-slate-50')}>
                  <Avatar nome={u.nome} cor={u.corAvatar} className={cn(!u.ativo && 'opacity-50')} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className={cn('truncate font-medium', u.ativo ? 'text-slate-800' : 'text-slate-400 line-through')}>
                      {u.nome}
                      {souEu && <span className="ml-2 text-xs font-normal text-slate-400">(você)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      <span className="font-mono">{u.usuario}</span> · {u._count.solicitacoes} solicitação(ões) · desde{' '}
                      {formatarData(u.criadoEm)}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', corPerfil[u.perfil])}>
                    {ROTULO_PERFIL[u.perfil]}
                  </span>
                  {!u.ativo && <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Inativo</span>}
                  <div className="flex gap-1">
                    <Button variante="fantasma" tamanho="sm" title="Editar" aria-label={`Editar ${u.nome}`} onClick={() => setDialogo({ tipo: 'editar', usuario: u })}>
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <Button variante="fantasma" tamanho="sm" title="Redefinir senha" aria-label={`Redefinir senha de ${u.nome}`} onClick={() => setDialogo({ tipo: 'senha', usuario: u })}>
                      <KeyRound aria-hidden className="size-4" />
                    </Button>
                    <Button
                      variante="fantasma"
                      tamanho="sm"
                      disabled={souEu}
                      title={souEu ? 'Você não pode desativar a própria conta' : u.ativo ? 'Desativar' : 'Reativar'}
                      aria-label={`${u.ativo ? 'Desativar' : 'Reativar'} ${u.nome}`}
                      onClick={() => setDialogo({ tipo: 'ativacao', usuario: u })}
                    >
                      {u.ativo ? <UserX aria-hidden className="size-4" /> : <UserCheck aria-hidden className="size-4" />}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Modal aberto={dialogo?.tipo === 'novo'} titulo="Novo usuário" descricao="A pessoa poderá trocar a senha depois, em Meu perfil." onFechar={fechar}>
        <FormNovoUsuario onConcluir={fechar} />
      </Modal>

      <Modal aberto={dialogo?.tipo === 'editar'} titulo="Editar usuário" onFechar={fechar}>
        {dialogo?.tipo === 'editar' && <FormEditarUsuario usuario={dialogo.usuario} souEu={dialogo.usuario.id === eu.id} onConcluir={fechar} />}
      </Modal>

      <Modal aberto={dialogo?.tipo === 'senha'} titulo="Redefinir senha" descricao={dialogo?.tipo === 'senha' ? dialogo.usuario.nome : undefined} onFechar={fechar}>
        {dialogo?.tipo === 'senha' && <FormRedefinirSenha usuario={dialogo.usuario} onConcluir={fechar} />}
      </Modal>

      {dialogo?.tipo === 'ativacao' && <ConfirmarAtivacao usuario={dialogo.usuario} onFechar={fechar} />}
    </>
  )
}

const novoSchema = z.object({
  nome: z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres').max(100),
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'O usuário deve ter pelo menos 3 caracteres')
    .max(50)
    .regex(/^[a-z0-9._-]+$/, 'Use letras minúsculas, números, ponto, hífen ou sublinhado'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(100),
  perfil: z.enum(PERFIS),
})
type Novo = z.infer<typeof novoSchema>

function FormNovoUsuario({ onConcluir }: { onConcluir: () => void }) {
  const criar = useCriarUsuario()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Novo>({
    resolver: zodResolver(novoSchema),
    defaultValues: { perfil: 'SOLICITANTE' },
  })

  const enviar = async (dados: Novo) => {
    try {
      await criar.mutateAsync(dados)
      toast.success(`Usuário ${dados.usuario} criado`)
      onConcluir()
    } catch (erro) {
      const porCampo = errosDeCampo(erro)
      if (porCampo.length) porCampo.forEach((c) => setError(c.campo as keyof Novo, { message: c.mensagem }))
      else toast.error(mensagemDeErro(erro))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <div className="space-y-4 px-6 py-5">
        <Campo id="novo-nome" rotulo="Nome completo" erro={errors.nome?.message}>
          <Input id="novo-nome" autoFocus erro={errors.nome?.message} {...register('nome')} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="novo-usuario" rotulo="Usuário de acesso" erro={errors.usuario?.message}>
            <Input id="novo-usuario" autoComplete="off" placeholder="ex.: carlos.lima" erro={errors.usuario?.message} {...register('usuario')} />
          </Campo>
          <Campo id="novo-perfil" rotulo="Perfil" erro={errors.perfil?.message}>
            <Select id="novo-perfil" {...register('perfil')}>
              {PERFIS.map((p) => <option key={p} value={p}>{ROTULO_PERFIL[p]}</option>)}
            </Select>
          </Campo>
        </div>
        <Campo id="novo-senha" rotulo="Senha inicial" erro={errors.senha?.message} dica="Mínimo de 6 caracteres">
          <Input id="novo-senha" type="password" autoComplete="new-password" erro={errors.senha?.message} {...register('senha')} />
        </Campo>
      </div>
      <Rodape carregando={criar.isPending} rotulo="Criar usuário" onCancelar={onConcluir} />
    </form>
  )
}

const edicaoSchema = z.object({
  nome: z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres').max(100),
  perfil: z.enum(PERFIS),
})
type Edicao = z.infer<typeof edicaoSchema>

function FormEditarUsuario({ usuario, souEu, onConcluir }: { usuario: UsuarioAdmin; souEu: boolean; onConcluir: () => void }) {
  const atualizar = useAtualizarUsuario()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Edicao>({
    resolver: zodResolver(edicaoSchema),
    defaultValues: { nome: usuario.nome, perfil: usuario.perfil },
  })

  const enviar = async (dados: Edicao) => {
    try {
      // Não reenvia o perfil da própria conta (o backend recusaria)
      await atualizar.mutateAsync({ id: usuario.id, nome: dados.nome, ...(!souEu && { perfil: dados.perfil }) })
      toast.success('Usuário atualizado')
      onConcluir()
    } catch (erro) {
      const porCampo = errosDeCampo(erro)
      if (porCampo.length) porCampo.forEach((c) => setError(c.campo as keyof Edicao, { message: c.mensagem }))
      else toast.error(mensagemDeErro(erro))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <div className="space-y-4 px-6 py-5">
        <Campo id="editar-nome" rotulo="Nome completo" erro={errors.nome?.message}>
          <Input id="editar-nome" autoFocus erro={errors.nome?.message} {...register('nome')} />
        </Campo>
        <Campo id="editar-perfil" rotulo="Perfil" dica={souEu ? 'Você não pode alterar o perfil da própria conta.' : 'A mudança vale imediatamente, sem novo login.'}>
          <Select id="editar-perfil" disabled={souEu} {...register('perfil')}>
            {PERFIS.map((p) => <option key={p} value={p}>{ROTULO_PERFIL[p]}</option>)}
          </Select>
        </Campo>
      </div>
      <Rodape carregando={atualizar.isPending} rotulo="Salvar" onCancelar={onConcluir} />
    </form>
  )
}

const senhaSchema = z.object({ senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(100) })

function FormRedefinirSenha({ usuario, onConcluir }: { usuario: UsuarioAdmin; onConcluir: () => void }) {
  const redefinir = useRedefinirSenha()
  const { register, handleSubmit, formState: { errors } } = useForm<{ senha: string }>({ resolver: zodResolver(senhaSchema) })

  const enviar = async ({ senha }: { senha: string }) => {
    try {
      await redefinir.mutateAsync({ id: usuario.id, senha })
      toast.success(`Senha de ${usuario.nome} redefinida`)
      onConcluir()
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <div className="px-6 py-5">
        <Campo id="redefinir-senha" rotulo="Nova senha" erro={errors.senha?.message} dica="Informe a nova senha à pessoa por um canal seguro.">
          <Input id="redefinir-senha" type="password" autoFocus autoComplete="new-password" erro={errors.senha?.message} {...register('senha')} />
        </Campo>
      </div>
      <Rodape carregando={redefinir.isPending} rotulo="Redefinir senha" onCancelar={onConcluir} />
    </form>
  )
}

function ConfirmarAtivacao({ usuario, onFechar }: { usuario: UsuarioAdmin; onFechar: () => void }) {
  const atualizar = useAtualizarUsuario()
  const desativar = usuario.ativo

  const confirmar = async () => {
    try {
      await atualizar.mutateAsync({ id: usuario.id, ativo: !desativar })
      toast.success(`${usuario.nome} ${desativar ? 'desativado(a)' : 'reativado(a)'}`)
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    } finally {
      onFechar()
    }
  }

  return (
    <DialogoConfirmacao
      aberto
      titulo={desativar ? 'Desativar usuário?' : 'Reativar usuário?'}
      rotuloConfirmar={desativar ? 'Desativar' : 'Reativar'}
      variante={desativar ? 'perigo' : 'primario'}
      carregando={atualizar.isPending}
      onConfirmar={confirmar}
      onCancelar={onFechar}
    >
      {desativar ? (
        <>
          <strong>{usuario.nome}</strong> perderá o acesso imediatamente. As solicitações e o histórico dele(a) são mantidos.
        </>
      ) : (
        <>
          <strong>{usuario.nome}</strong> voltará a ter acesso ao portal.
        </>
      )}
    </DialogoConfirmacao>
  )
}

function Rodape({ carregando, rotulo, onCancelar }: { carregando: boolean; rotulo: string; onCancelar: () => void }) {
  return (
    <div className="flex justify-end gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4">
      <Button variante="secundario" onClick={onCancelar} disabled={carregando}>
        Cancelar
      </Button>
      <Button type="submit" carregando={carregando}>
        {rotulo}
      </Button>
    </div>
  )
}

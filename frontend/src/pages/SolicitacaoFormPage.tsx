import { Link, useNavigate, useParams } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/lib/avisos'
import { ArrowLeft, Lock } from 'lucide-react'
import { errosDeCampo, mensagemDeErro } from '@/api/errors'
import { useCategorias } from '@/hooks/useAdmin'
import { useUsuarioLogado } from '@/hooks/useAuth'
import { useAtualizarSolicitacao, useCriarSolicitacao, useSolicitacao } from '@/hooks/useSolicitacoes'
import { formatarCodigo } from '@/lib/format'
import type { Categoria, CategoriaResumo, SolicitacaoInput } from '@/types'
import { BotaoLink, Button } from '@/components/ui/Button'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Campo, Input, Select, Textarea } from '@/components/ui/Campo'
import { Card } from '@/components/ui/Card'
import { Carregando, ErroCarregamento } from '@/components/ui/Estados'

// Mesmas regras do backend, para dar retorno imediato ao usuário
const schema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(150, 'O título deve ter no máximo 150 caracteres'),
  descricao: z
    .string()
    .trim()
    .min(10, 'A descrição deve ter pelo menos 10 caracteres')
    .max(5000, 'A descrição deve ter no máximo 5000 caracteres'),
  categoriaId: z.number({ error: 'Selecione uma categoria' }).int().positive('Selecione uma categoria'),
})

export function SolicitacaoFormPage() {
  const { id: idParam } = useParams()
  return idParam ? <EditarSolicitacao id={Number(idParam)} /> : <NovaSolicitacao />
}

function NovaSolicitacao() {
  const navigate = useNavigate()
  const criar = useCriarSolicitacao()

  return (
    <>
      <Voltar para="/solicitacoes" />
      <CabecalhoPagina titulo="Nova solicitação" descricao="Descreva sua demanda. Ela será registrada com status Aberto." />
      <FormularioSolicitacao
        rotuloEnviar="Registrar solicitação"
        onEnviar={async (dados) => {
          const criada = await criar.mutateAsync(dados)
          toast.success(`Solicitação ${formatarCodigo(criada.id)} registrada`)
          navigate(`/solicitacoes/${criada.id}`, { replace: true })
        }}
        onCancelar={() => navigate('/solicitacoes')}
      />
    </>
  )
}

function EditarSolicitacao({ id }: { id: number }) {
  const navigate = useNavigate()
  const usuario = useUsuarioLogado()
  const consulta = useSolicitacao(id)
  const atualizar = useAtualizarSolicitacao(id)

  if (consulta.isPending) return <Carregando />
  if (consulta.isError) {
    return (
      <Card>
        <ErroCarregamento mensagem={mensagemDeErro(consulta.error, 'Não foi possível carregar a solicitação.')} />
      </Card>
    )
  }

  const s = consulta.data
  const podeEditar = s.solicitante.id === usuario.id && s.status === 'ABERTO'

  return (
    <>
      <Voltar para={`/solicitacoes/${id}`} />
      <CabecalhoPagina titulo={`Editar solicitação ${formatarCodigo(id)}`} />
      {podeEditar ? (
        <FormularioSolicitacao
          valoresIniciais={{ titulo: s.titulo, descricao: s.descricao, categoriaId: s.categoria.id }}
          categoriaAtual={s.categoria}
          rotuloEnviar="Salvar alterações"
          onEnviar={async (dados) => {
            await atualizar.mutateAsync(dados)
            toast.success('Solicitação atualizada')
            navigate(`/solicitacoes/${id}`, { replace: true })
          }}
          onCancelar={() => navigate(`/solicitacoes/${id}`)}
        />
      ) : (
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <Lock aria-hidden className="size-10 text-neutra-300" />
          <p className="mt-3 font-medium text-neutra-700">Esta solicitação não pode ser editada</p>
          <p className="mt-1 max-w-sm text-sm text-neutra-500">
            Apenas o solicitante pode editar, e somente enquanto o status for "Aberto".
          </p>
          <BotaoLink to={`/solicitacoes/${id}`} variante="secundario" className="mt-5">
            Ver detalhes
          </BotaoLink>
        </Card>
      )}
    </>
  )
}

interface FormularioProps {
  valoresIniciais?: SolicitacaoInput
  /** Na edição: mantida entre as opções mesmo se tiver sido desativada. */
  categoriaAtual?: CategoriaResumo
  rotuloEnviar: string
  onEnviar: (dados: SolicitacaoInput) => Promise<void>
  onCancelar: () => void
}

/** Carrega as categorias antes de montar o formulário, para o <select> já nascer com a opção certa. */
function FormularioSolicitacao({ categoriaAtual, ...props }: FormularioProps) {
  const categorias = useCategorias()

  if (categorias.isPending) return <Carregando />
  if (categorias.isError) {
    return (
      <Card>
        <ErroCarregamento mensagem={mensagemDeErro(categorias.error)} onTentarNovamente={() => categorias.refetch()} />
      </Card>
    )
  }

  const opcoes = categorias.data.filter((c) => c.ativa || c.id === categoriaAtual?.id)
  if (categoriaAtual && !opcoes.some((c) => c.id === categoriaAtual.id)) {
    opcoes.unshift({ ...categoriaAtual, ativa: false })
  }

  return <CamposSolicitacao {...props} opcoes={opcoes} />
}

function CamposSolicitacao({
  valoresIniciais,
  opcoes,
  rotuloEnviar,
  onEnviar,
  onCancelar,
}: Omit<FormularioProps, 'categoriaAtual'> & { opcoes: Categoria[] }) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SolicitacaoInput>({
    resolver: zodResolver(schema),
    defaultValues: valoresIniciais ?? { titulo: '', descricao: '' },
  })

  const enviar = async (dados: SolicitacaoInput) => {
    try {
      await onEnviar(dados)
    } catch (erro) {
      const porCampo = errosDeCampo(erro)
      if (porCampo.length > 0) {
        porCampo.forEach(({ campo, mensagem }) => setError(campo as keyof SolicitacaoInput, { message: mensagem }))
      } else {
        toast.error(mensagemDeErro(erro))
      }
    }
  }

  const tamanhoDescricao = useWatch({ control, name: 'descricao' })?.length ?? 0

  return (
    <Card className="max-w-3xl">
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5 p-6">
        <Campo id="titulo" rotulo="Título" erro={errors.titulo?.message}>
          <Input
            id="titulo"
            maxLength={150}
            placeholder="Resumo curto da demanda"
            erro={errors.titulo?.message}
            {...register('titulo')}
          />
        </Campo>

        <Campo id="categoriaId" rotulo="Categoria" erro={errors.categoriaId?.message} className="sm:max-w-xs">
          <Select
            id="categoriaId"
            erro={errors.categoriaId?.message}
            defaultValue=""
            {...register('categoriaId', { valueAsNumber: true })}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {opcoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {!c.ativa && ' (desativada)'}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo
          id="descricao"
          rotulo="Descrição"
          erro={errors.descricao?.message}
          dica={`${tamanhoDescricao}/5000 caracteres`}
        >
          <Textarea
            id="descricao"
            rows={6}
            maxLength={5000}
            placeholder="Explique o que precisa, onde e, se possível, desde quando."
            erro={errors.descricao?.message}
            {...register('descricao')}
          />
        </Campo>

        <div className="flex flex-col-reverse gap-2 border-t border-neutra-200 pt-5 sm:flex-row sm:justify-end">
          <Button variante="secundario" onClick={onCancelar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" carregando={isSubmitting}>
            {rotuloEnviar}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function Voltar({ para }: { para: string }) {
  return (
    <Link to={para} className="mb-4 inline-flex items-center gap-1 text-sm text-neutra-500 hover:text-neutra-800">
      <ArrowLeft aria-hidden className="size-4" />
      Voltar
    </Link>
  )
}

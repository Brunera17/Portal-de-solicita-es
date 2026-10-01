import { Link } from 'react-router'

export function NaoEncontradaPage() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm font-semibold text-primaria-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-neutra-900">Página não encontrada</h1>
      <p className="mt-2 text-sm text-neutra-500">O endereço acessado não existe.</p>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-primaria-600 hover:text-primaria-700">
        Voltar ao início
      </Link>
    </div>
  )
}

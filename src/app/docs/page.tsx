import Link from 'next/link'

export default function Docs() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 w-full max-w-4xl">
        <nav className="mb-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            ← Voltar para o início
          </Link>
        </nav>
        
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 text-center">Documentação</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 text-center">
            Guias e referências para usar o sistema LudicoM
          </p>
        </div>
        
        <div className="space-y-8">
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">Guia de Início Rápido</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Primeiros passos para começar a usar o sistema LudicoM.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
              <li>Como fazer login no sistema</li>
              <li>Navegação básica pela interface</li>
              <li>Configuração do perfil de usuário</li>
              <li>Primeiras configurações</li>
            </ul>
          </section>
          
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">Manual do Usuário</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Documentação completa para diferentes tipos de usuários.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <h3 className="font-semibold mb-2">Estudantes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Como acessar notas, materiais e comunicações
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <h3 className="font-semibold mb-2">Professores</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Gestão de turmas, lançamento de notas e materiais
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <h3 className="font-semibold mb-2">Administradores</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Configurações do sistema e relatórios
                </p>
              </div>
            </div>
          </section>
          
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">API e Integrações</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Documentação técnica para desenvolvedores e integrações.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
              <li>Referência da API REST</li>
              <li>Autenticação e autorização</li>
              <li>Webhooks e eventos</li>
              <li>Exemplos de código</li>
            </ul>
          </section>
          
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Perguntas frequentes e soluções para problemas comuns.
            </p>
            <div className="space-y-3">
              <details className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <summary className="font-semibold cursor-pointer">Como recuperar minha senha?</summary>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Use a opção &quot;Esqueci minha senha&quot; na tela de login e siga as instruções enviadas por email.
                </p>
              </details>
              <details className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <summary className="font-semibold cursor-pointer">Como alterar meus dados pessoais?</summary>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Acesse &quot;Meu Perfil&quot; no menu superior e edite as informações desejadas.
                </p>
              </details>
              <details className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <summary className="font-semibold cursor-pointer">Onde encontro os materiais das disciplinas?</summary>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Os materiais estão disponíveis na seção &quot;Disciplinas&quot; de cada matéria em que você está matriculado.
                </p>
              </details>
            </div>
          </section>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Não encontrou o que estava procurando?
          </p>
          <Link 
            href="/contact" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Solicitar Suporte
          </Link>
        </div>
      </div>
    </main>
  )
}
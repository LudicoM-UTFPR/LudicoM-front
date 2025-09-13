import Link from 'next/link'

export default function Features() {
  const features = [
    {
      title: "Gestão de Estudantes",
      description: "Sistema completo para cadastro, acompanhamento e gestão de informações dos estudantes.",
      icon: "👥"
    },
    {
      title: "Portal do Professor",
      description: "Interface dedicada para professores gerenciarem turmas, notas e materiais didáticos.",
      icon: "👨‍🏫"
    },
    {
      title: "Administração Acadêmica",
      description: "Ferramentas administrativas para gestão de cursos, disciplinas e grade curricular.",
      icon: "🏛️"
    },
    {
      title: "Relatórios e Analytics",
      description: "Dashboards e relatórios detalhados para análise de desempenho e métricas educacionais.",
      icon: "📊"
    },
    {
      title: "Comunicação Integrada",
      description: "Sistema de mensagens e notificações para manter todos os usuários conectados.",
      icon: "💬"
    },
    {
      title: "Biblioteca Digital",
      description: "Acesso a recursos digitais e materiais de estudo organizados por disciplina.",
      icon: "📚"
    }
  ]

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 w-full max-w-6xl">
        <nav className="mb-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            ← Voltar para o início
          </Link>
        </nav>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Funcionalidades</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Conheça as principais funcionalidades do sistema LudicoM
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Interessado em saber mais sobre alguma funcionalidade específica?
          </p>
          <Link 
            href="/contact" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Entre em Contato
          </Link>
        </div>
      </div>
    </main>
  )
}
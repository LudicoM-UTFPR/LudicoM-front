import Link from 'next/link'

export default function About() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 w-full max-w-5xl">
        <nav className="mb-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            ← Voltar para o início
          </Link>
        </nav>
        
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center">Sobre o LudicoM</h1>
          
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-lg leading-relaxed mb-6">
              O LudicoM é um sistema de gestão educacional desenvolvido pela 
              Universidade Tecnológica Federal do Paraná (UTFPR) com o objetivo de 
              modernizar e otimizar os processos educacionais.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Nossa Missão</h2>
            <p className="leading-relaxed mb-6">
              Fornecer uma plataforma integrada e intuitiva que facilite a gestão 
              acadêmica, promovendo uma experiência educacional mais eficiente para 
              estudantes, professores e administradores.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Objetivos</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>Centralizar informações acadêmicas</li>
              <li>Facilitar a comunicação entre os envolvidos</li>
              <li>Automatizar processos administrativos</li>
              <li>Fornecer relatórios e análises em tempo real</li>
              <li>Melhorar a experiência do usuário</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Tecnologias</h2>
            <p className="leading-relaxed">
              Este front-end foi desenvolvido utilizando Next.js, React, TypeScript 
              e Tailwind CSS, garantindo uma interface moderna, responsiva e performática.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
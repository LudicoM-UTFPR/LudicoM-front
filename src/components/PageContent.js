import React, { useContext } from 'react';
import { NavigationContext } from '../App';
import '../styles/PageContent.css';

const PageContent = () => {
  const { currentPage } = useContext(NavigationContext);

  const getPageContent = () => {
    switch (currentPage) {
      case 'Home':
        return {
          title: 'Bem-vindo ao LudicoM',
          content: (
            <div>
              <p>Sistema de gerenciamento para atividades lúdicas e educacionais.</p>
              <p>Navegue pelos menus acima para explorar as funcionalidades do sistema.</p>
            </div>
          )
        };
      case 'Eventos':
        return {
          title: 'Eventos',
          content: (
            <div>
              <p>Gerencie e acompanhe todos os eventos do sistema.</p>
              <p>Aqui você poderá criar, editar e visualizar eventos programados.</p>
            </div>
          )
        };
      case 'Jogos':
        return {
          title: 'Jogos',
          content: (
            <div>
              <p>Catálogo completo de jogos disponíveis no sistema.</p>
              <p>Organize e administre a coleção de jogos educacionais.</p>
            </div>
          )
        };
      case 'Participantes':
        return {
          title: 'Participantes',
          content: (
            <div>
              <p>Gerencie informações dos participantes das atividades.</p>
              <p>Controle cadastros, participações e histórico dos usuários.</p>
            </div>
          )
        };
      case 'Empréstimos':
        return {
          title: 'Empréstimos',
          content: (
            <div>
              <p>Controle de empréstimos de materiais e jogos.</p>
              <p>Acompanhe devoluções, prazos e disponibilidade dos itens.</p>
            </div>
          )
        };
      default:
        return {
          title: 'Página não encontrada',
          content: <p>A página solicitada não foi encontrada.</p>
        };
    }
  };

  const { title, content } = getPageContent();

  return (
    <div className="page-content">
      <div className="content-container">
        <h2 className="page-title">{title}</h2>
        <div className="page-description">
          {content}
        </div>
      </div>
    </div>
  );
};

export default PageContent;
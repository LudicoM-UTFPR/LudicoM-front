import { useState, useCallback } from 'react';
import { generateId as generateIdUtil } from '../utils';

/**
 * Hook personalizado para operações CRUD padrão
 * Centraliza a lógica repetitiva de estado e handlers usada em todas as páginas
 */
export function useCrudOperations<T extends { id: number | string }>() {
  // Estados dos modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Item selecionado
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  // Handler para abrir modal de detalhes
  const handleDetalhes = useCallback((item: T) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  // Handler para abrir modal de edição
  const handleEditar = useCallback((item: T) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }, []);

  // Handler para abrir modal de criação
  const handleCriar = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  // Factory para criar handler de exclusão personalizado
  const createHandleExcluir = useCallback((
    items: T[],
    setItems: (items: T[]) => void,
    getConfirmMessage: (item: T) => string
  ) => {
    return (item: T) => {
      if (window.confirm(getConfirmMessage(item))) {
        setItems(items.filter(i => String(i.id) !== String(item.id)));
        // Fecha modal se o item excluído estava sendo visualizado
        if (selectedItem && String(selectedItem.id) === String(item.id)) {
          setIsModalOpen(false);
          setSelectedItem(null);
        }
      }
    };
  }, [selectedItem]);

  // Factory para criar handler de salvamento de edição
  const createHandleSalvarEdicao = useCallback((
    items: T[],
    setItems: (items: T[]) => void,
    updateItemData?: (item: T) => T
  ) => {
    return (itemAtualizado: T) => {
      const finalItem = updateItemData ? updateItemData(itemAtualizado) : itemAtualizado;
      
      setItems(items.map(item => 
        String(item.id) === String(finalItem.id) ? finalItem : item
      ));
      
      // Atualiza o item selecionado para refletir as mudanças no DetailModal
      setSelectedItem(finalItem);
    };
  }, []);

  // Factory para criar handler de salvamento de criação
  const createHandleSalvarCriacao = useCallback((
    items: T[],
    setItems: (items: T[]) => void,
    generateId?: (items: T[]) => number | string,
    prepareNewItem?: (item: any) => T
  ) => {
    return (novoItem: any) => {
      let id: number | string;

      if (generateId) {
        id = generateId(items);
      } else {
        // Decide gerador de id baseado no tipo do primeiro item (se existir)
        if (items.length > 0 && typeof items[0].id === 'string') {
          id = generateIdUtil();
        } else {
          // Mesmo que coleção atual esteja vazia ou numérica, padronize como string
          id = generateIdUtil();
        }
      }
      const itemComId = prepareNewItem 
        ? prepareNewItem({ ...novoItem, id })
        : { ...novoItem, id };
      
      setItems([...items, itemComId]);
      setIsCreateModalOpen(false);
    };
  }, []);

  // Handlers para fechar modais
  const closeDetailModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  return {
    // Estados
    selectedItem,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    
    // Handlers básicos
    handleDetalhes,
    handleEditar,
    handleCriar,
    
    // Factories para handlers customizados
    createHandleExcluir,
    createHandleSalvarEdicao,
    createHandleSalvarCriacao,
    
    // Handlers para fechar modais
    closeDetailModal,
    closeEditModal,
    closeCreateModal,
    
    // Setters para casos especiais
    setSelectedItem,
    setIsModalOpen,
    setIsEditModalOpen,
    setIsCreateModalOpen,
  };
}

export default useCrudOperations;
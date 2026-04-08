import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardNavigationProps {
  children: React.ReactNode;
}

const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({ children }) => {
  const navigate = useNavigate();
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const currentFocusIndexRef = useRef(0);

  useEffect(() => {
    const updateFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[data-navigable="true"]' // Adicionar elementos navegáveis personalizados
      ];

      try {
        const elements = document.querySelectorAll(focusableSelectors.join(', ')) as NodeListOf<HTMLElement>;
        focusableElementsRef.current = Array.from(elements).filter(el => {
          // Verificar se o elemento está visível
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0
          );
        });
      } catch (error) {
        console.error('Error updating focusable elements:', error);
        focusableElementsRef.current = [];
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      
      // Ignorar se estiver em campos de input/textarea
      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.contentEditable === 'true'
      ) {
        return;
      }

      // Navegação por setas - Navegação 2D espacial
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        
        if (focusableElementsRef.current.length === 0) {
          updateFocusableElements();
        }

        const elements = focusableElementsRef.current;
        const currentElement = document.activeElement as HTMLElement;
        
        if (!currentElement || !elements.includes(currentElement)) {
          // Se não há elemento focado ou o elemento atual não está na lista, focar o primeiro
          if (elements[0]) {
            elements[0].focus();
            currentFocusIndexRef.current = 0;
          }
          return;
        }

        const currentRect = currentElement.getBoundingClientRect();
        const currentCenterX = currentRect.left + currentRect.width / 2;
        const currentCenterY = currentRect.top + currentRect.height / 2;

        let bestCandidate: HTMLElement | null = null;
        let bestDistance = Infinity;
        let bestAlignment = Infinity;

        for (const element of elements) {
          if (element === currentElement) continue;

          const rect = element.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const deltaX = centerX - currentCenterX;
          const deltaY = centerY - currentCenterY;

          let isValidDirection = false;
          let distance = Infinity;
          let alignment = Infinity;

          switch (key) {
            case 'ArrowUp':
              // Elemento deve estar ACIMA (deltaY < 0)
              if (deltaY < -10) {
                isValidDirection = true;
                distance = Math.abs(deltaY);
                alignment = Math.abs(deltaX);
              }
              break;
            case 'ArrowDown':
              // Elemento deve estar ABAIXO (deltaY > 0)
              if (deltaY > 10) {
                isValidDirection = true;
                distance = Math.abs(deltaY);
                alignment = Math.abs(deltaX);
              }
              break;
            case 'ArrowLeft':
              // Elemento deve estar à ESQUERDA (deltaX < 0)
              if (deltaX < -10) {
                isValidDirection = true;
                distance = Math.abs(deltaX);
                alignment = Math.abs(deltaY);
              }
              break;
            case 'ArrowRight':
              // Elemento deve estar à DIREITA (deltaX > 0)
              if (deltaX > 10) {
                isValidDirection = true;
                distance = Math.abs(deltaX);
                alignment = Math.abs(deltaY);
              }
              break;
          }

          if (isValidDirection) {
            // Priorizar elementos alinhados (menor alignment) e depois mais próximos
            const score = distance + alignment * 2;
            if (score < bestDistance) {
              bestDistance = score;
              bestCandidate = element;
            }
          }
        }

        if (bestCandidate) {
          bestCandidate.focus();
          const newIndex = elements.indexOf(bestCandidate);
          currentFocusIndexRef.current = newIndex;
          
          // Scroll para o elemento se necessário
          const rect = bestCandidate.getBoundingClientRect();
          const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                              rect.bottom <= window.innerHeight && 
                              rect.right <= window.innerWidth;
          
          if (!isInViewport) {
            bestCandidate.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'nearest'
            });
          }
        }
      }

      // Navegação por seções (Ctrl + Arrow)
      if (e.ctrlKey && ['ArrowUp', 'ArrowDown'].includes(key)) {
        e.preventDefault();
        
        const currentElement = document.activeElement as HTMLElement;
        if (!currentElement) return;
        
        // Encontrar seção atual
        const currentSection = currentElement.closest('[data-nav-section]');
        if (!currentSection) return;
        
        const allSections = Array.from(document.querySelectorAll('[data-nav-section]'));
        const currentSectionIndex = allSections.indexOf(currentSection);
        
        let nextSectionIndex = currentSectionIndex;
        
        if (key === 'ArrowUp') {
          nextSectionIndex = currentSectionIndex - 1;
          if (nextSectionIndex < 0) nextSectionIndex = allSections.length - 1;
        } else if (key === 'ArrowDown') {
          nextSectionIndex = currentSectionIndex + 1;
          if (nextSectionIndex >= allSections.length) nextSectionIndex = 0;
        }
        
        const nextSection = allSections[nextSectionIndex] as HTMLElement;
        if (nextSection) {
          const firstFocusable = nextSection.querySelector('[data-navigable="true"], button, [href], [tabindex]:not([tabindex="-1"])') as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          }
          nextSection.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // Atalhos de navegação
      switch (key) {
        case 'Home':
          e.preventDefault();
          navigate('/');
          break;
        case 'End':
          e.preventDefault();
          // Navegar para o final da página (última seção)
          const lastSection = document.querySelector('section:last-child');
          if (lastSection) {
            lastSection.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        case 'PageUp':
          e.preventDefault();
          window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
          break;
        case 'PageDown':
          e.preventDefault();
          window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
          break;
        case 'Escape':
          e.preventDefault();
          // Fechar modais ou voltar
          const modal = document.querySelector('[role="dialog"]');
          if (modal) {
            const closeButton = modal.querySelector('button[aria-label*="Close"], button[aria-label*="Fechar"]');
            if (closeButton) {
              (closeButton as HTMLElement).click();
            }
          } else {
            navigate(-1);
          }
          break;
        case '/':
          e.preventDefault();
          // Focar na busca
          const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.click();
          }
          break;
        case 'Enter':
        case ' ':
          // Ativar elemento focado
          if (activeElement && activeElement !== document.body) {
            e.preventDefault();
            activeElement.click();
          }
          break;
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const index = focusableElementsRef.current.indexOf(target);
      if (index !== -1) {
        currentFocusIndexRef.current = index;
      }
    };

    // Atualizar elementos focáveis quando o DOM mudar
    const observer = new MutationObserver(() => {
      try {
        updateFocusableElements();
      } catch (error) {
        console.error('Error in mutation observer:', error);
      }
    });

    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'hidden', 'style', 'class']
      });
    } catch (error) {
      console.error('Error setting up mutation observer:', error);
    }

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    
    // Inicialização
    try {
      updateFocusableElements();
    } catch (error) {
      console.error('Error initializing focusable elements:', error);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      observer.disconnect();
    };
  }, [navigate]);



  return <>{children}</>;
};

export default KeyboardNavigation;

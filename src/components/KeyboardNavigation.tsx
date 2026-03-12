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
        '[tabindex]:not([tabindex="-1"])'
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

      // Navegação por setas
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        
        if (focusableElementsRef.current.length === 0) {
          updateFocusableElements();
        }

        const elements = focusableElementsRef.current;
        const currentIndex = currentFocusIndexRef.current;
        
        let nextIndex = currentIndex;
        
        switch (key) {
          case 'ArrowUp':
          case 'ArrowLeft':
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = elements.length - 1;
            break;
          case 'ArrowDown':
          case 'ArrowRight':
            nextIndex = currentIndex + 1;
            if (nextIndex >= elements.length) nextIndex = 0;
            break;
        }

        if (elements[nextIndex]) {
          elements[nextIndex].focus();
          currentFocusIndexRef.current = nextIndex;
          
          // Scroll para o elemento se necessário
          const rect = elements[nextIndex].getBoundingClientRect();
          const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                              rect.bottom <= window.innerHeight && 
                              rect.right <= window.innerWidth;
          
          if (!isInViewport) {
            elements[nextIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'nearest'
            });
          }
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

  // Adicionar indicadores visuais de navegação
  useEffect(() => {
    const addNavigationIndicators = () => {
      try {
        // Adicionar tooltip para elementos navegáveis
        const style = document.createElement('style');
        style.textContent = `
          [data-keyboard-nav="true"] {
            position: relative;
          }
          
          [data-keyboard-nav="true"]:focus {
            outline: 2px solid #00A8E1;
            outline-offset: 2px;
          }
          
          .keyboard-nav-hint {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #00A8E1;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
          }
          
          @media (hover: hover) {
            .keyboard-nav-hint {
              opacity: 0;
              transition: opacity 0.2s;
            }
            
            [data-keyboard-nav="true"]:hover .keyboard-nav-hint {
              opacity: 1;
            }
          }
        `;
        document.head.appendChild(style);

        // Marcar elementos navegáveis
        const focusableElements = document.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach((element, index) => {
          if (index < 9) { // Apenas os 9 primeiros elementos
            (element as HTMLElement).setAttribute('data-keyboard-nav', 'true');
            
            const hint = document.createElement('div');
            hint.className = 'keyboard-nav-hint';
            hint.textContent = (index + 1).toString();
            (element as HTMLElement).appendChild(hint);
          }
        });
      } catch (error) {
        console.error('Error adding navigation indicators:', error);
      }
    };

    // Adicionar indicadores após um pequeno delay para garantir que o DOM esteja pronto
    const timeout = setTimeout(addNavigationIndicators, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return <>{children}</>;
};

export default KeyboardNavigation;

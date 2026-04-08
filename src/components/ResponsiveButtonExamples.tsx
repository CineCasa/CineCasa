import ResponsiveButton from '@/components/ResponsiveButton';
import { Play, Info, Heart } from 'lucide-react';

/**
 * EXEMPLOS DE USO - ResponsiveButton
 * 
 * Componente totalmente responsivo para todos os tamanhos de tela
 * De 320px (celulares antigos) até 4K (3840px)
 */

export function ResponsiveButtonExamples() {
  return (
    <div className="space-y-8 p-8">
      {/* ============= BOTÕES PADRÃO ============= */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Botões Padrão</h2>
        
        <div className="space-y-3 flex flex-col">
          <ResponsiveButton variant="default">
            Botão Padrão
          </ResponsiveButton>

          <ResponsiveButton variant="default" size="lg">
            Botão Grande
          </ResponsiveButton>

          <ResponsiveButton variant="default" size="sm">
            Botão Pequeno
          </ResponsiveButton>

          <ResponsiveButton variant="default" fullWidth>
            Botão Full Width (tela inteira)
          </ResponsiveButton>
        </div>
      </section>

      {/* ============= BOTÕES PREMIUM ============= */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Botões Premium (para Details/Streaming)</h2>
        
        <div className="space-y-3 flex flex-col">
          {/* Play Button */}
          <ResponsiveButton 
            variant="premium"
            size="lg"
            className="gap-3"
          >
            <Play size={24} fill="currentColor" />
            Assistir Agora
          </ResponsiveButton>

          {/* Trailer Button */}
          <ResponsiveButton 
            variant="premium-secondary"
            size="lg"
            className="gap-3"
          >
            <Play size={24} fill="currentColor" />
            Ver Trailer
          </ResponsiveButton>

          {/* Favorite Button (Icon) */}
          <ResponsiveButton 
            variant="premium-icon"
            size="icon-lg"
            ariaLabel="Adicionar aos Favoritos"
            title="Adicionar aos Favoritos"
          >
            <Heart size={24} />
          </ResponsiveButton>
        </div>
      </section>

      {/* ============= VARIANTES DE COR ============= */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Variantes de Cor</h2>
        
        <div className="space-y-3 flex flex-col">
          <ResponsiveButton variant="default">Default</ResponsiveButton>
          <ResponsiveButton variant="secondary">Secundário</ResponsiveButton>
          <ResponsiveButton variant="outline">Outline</ResponsiveButton>
          <ResponsiveButton variant="destructive">Destrutivo</ResponsiveButton>
          <ResponsiveButton variant="ghost">Ghost</ResponsiveButton>
          <ResponsiveButton variant="link">Link</ResponsiveButton>
        </div>
      </section>

      {/* ============= TAMANHOS ============= */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Tamanhos</h2>
        
        <div className="space-y-3 flex flex-col">
          <ResponsiveButton size="xs">Extra Pequeno</ResponsiveButton>
          <ResponsiveButton size="sm">Pequeno</ResponsiveButton>
          <ResponsiveButton size="default">Padrão</ResponsiveButton>
          <ResponsiveButton size="lg">Grande</ResponsiveButton>
          <ResponsiveButton size="xl">Extra Grande</ResponsiveButton>
        </div>
      </section>

      {/* ============= BOTÕES COM ÍCONES ============= */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Botões com Ícones</h2>
        
        <div className="flex flex-wrap gap-4">
          <ResponsiveButton variant="ghost" size="icon">
            <Play size={20} />
          </ResponsiveButton>

          <ResponsiveButton variant="ghost" size="icon-lg">
            <Info size={24} />
          </ResponsiveButton>

          <ResponsiveButton variant="ghost" size="icon-sm">
            <Heart size={16} />
          </ResponsiveButton>
        </div>
      </section>

      {/* ============= APLICAÇÃO REAL ============= */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Exemplo Real (Página de Detalhes)</h2>
        
        <div className="space-y-4 lg:space-y-0 lg:flex lg:gap-4">
          {/* Play Button - Principal */}
          <ResponsiveButton 
            variant="premium"
            size="lg"
            className="gap-3 flex-1 lg:flex-none"
          >
            <Play size={24} fill="currentColor" />
            <span className="hidden sm:inline">Assistir Agora</span>
            <span className="sm:hidden">Play</span>
          </ResponsiveButton>

          {/* Trailer Button - Secundário */}
          <ResponsiveButton 
            variant="premium-secondary"
            size="lg"
            className="gap-3 flex-1 lg:flex-none"
          >
            <Play size={24} fill="currentColor" />
            <span className="hidden sm:inline">Ver Trailer</span>
            <span className="sm:hidden">Trailer</span>
          </ResponsiveButton>

          {/* Favorite Button - Icon */}
          <ResponsiveButton 
            variant="premium-icon"
            size="icon-lg"
            ariaLabel="Adicionar aos Favoritos"
          >
            <Heart size={24} />
          </ResponsiveButton>
        </div>
      </section>

      {/* ============= MOBILE OPTIMIZATION ============= */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Otimização para Mobile</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Todos os botões têm altura mínima de 44px (padrão Apple) em mobile,
          respondendo automaticamente para telas maiores
        </p>

        <ResponsiveButton 
          variant="default" 
          fullWidth
          className="text-base sm:text-lg"
        >
          Este botão se adapta ao tamanho da tela
        </ResponsiveButton>
      </section>

      {/* ============= ACESSIBILIDADE ============= */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Acessibilidade</h2>
        
        <div className="space-y-3 flex flex-col">
          <ResponsiveButton
            aria-label="Executar ação importante"
            title="Dica de ferramenta"
          >
            Botão Acessível
          </ResponsiveButton>

          <ResponsiveButton disabled>Botão Desabilitado</ResponsiveButton>
        </div>
      </section>
    </div>
  );
}

/**
 * PROPRIEDADES DISPONÍVEIS
 * 
 * @prop {string} variant - 'default' | 'secondary' | 'destructive' | 'outline' | 
 *                         'ghost' | 'link' | 'premium' | 'premium-secondary' | 'premium-icon'
 * @prop {string} size - 'xs' | 'sm' | 'default' | 'lg' | 'xl' | 
 *                       'icon' | 'icon-sm' | 'icon-lg'
 * @prop {boolean} responsive - Ativa responsividade automática (padrão: true)
 * @prop {boolean} fullWidth - Ocupa 100% da largura
 * @prop {string} className - Classes CSS adicionais (Tailwind)
 * 
 * EXEMPLO DE USO:
 * 
 * <ResponsiveButton
 *   variant="premium"
 *   size="lg"
 *   fullWidth
 *   onClick={() => handlePlay()}
 *   className="gap-3"
 * >
 *   <Play size={24} />
 *   Assistir Agora
 * </ResponsiveButton>
 */

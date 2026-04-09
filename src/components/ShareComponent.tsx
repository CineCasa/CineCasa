import React, { useState } from 'react';
import { Share2, Download, Copy, Facebook, Twitter, Whatsapp, MessageCircle, Mail, Link, Check } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface ShareComponentProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  showNative?: boolean;
  showSocial?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export function ShareComponent({
  title,
  text = '',
  url = window.location.href,
  className = '',
  showNative = true,
  showSocial = true,
  position = 'bottom',
  size = 'md',
}: ShareComponentProps) {
  const { shareContent, canShare } = usePWA();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Compartilhar com API nativa
  const handleNativeShare = async () => {
    setIsSharing(true);
    
    try {
      const result = await shareContent({
        title,
        text,
        url,
      });
      
      if (result.success) {
        setIsOpen(false);
        
        // Analytics
        if ('gtag' in window) {
          (window as any).gtag('event', 'share', {
            method: result.method,
            content_type: 'movie',
            item_id: url,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Copiar link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      setTimeout(() => setCopied(false), 2000);
      
      // Analytics
      if ('gtag' in window) {
        (window as any).gtag('event', 'copy_link', {
          content_type: 'movie',
          item_id: url,
        });
      }
    } catch (error) {
      console.error('Erro ao copiar link:', error);
    }
  };

  // Compartilhar em redes sociais
  const shareToSocial = (platform: string) => {
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
      sms: `sms:?body=${encodeURIComponent(`${text} ${url}`)}`,
    };

    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      
      // Analytics
      if ('gtag' in window) {
        (window as any).gtag('event', 'share_social', {
          method: platform,
          content_type: 'movie',
          item_id: url,
        });
      }
    }
  };

  // Obter classes de tamanho
  const getSizeClasses = () => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
    };
    
    return sizeClasses[size];
  };

  // Obter classes de posicionamento
  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 flex gap-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200';
    
    switch (position) {
      case 'top':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'left':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      case 'right':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const socialButtons = [
    { icon: <Facebook className="w-4 h-4" />, label: 'Facebook', platform: 'facebook' },
    { icon: <Twitter className="w-4 h-4" />, label: 'Twitter', platform: 'twitter' },
    { icon: <Whatsapp className="w-4 h-4" />, label: 'WhatsApp', platform: 'whatsapp' },
    { icon: <MessageCircle className="w-4 h-4" />, label: 'Telegram', platform: 'telegram' },
    { icon: <Mail className="w-4 h-4" />, label: 'E-mail', platform: 'email' },
    { icon: <MessageCircle className="w-4 h-4" />, label: 'SMS', platform: 'sms' },
  ];

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Botão Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${getSizeClasses()} bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors`}
        title="Compartilhar"
      >
        <Share2 className="w-1/2 h-1/2" />
      </button>

      {/* Menu de Compartilhamento */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Conteúdo do Menu */}
          <div className={getPositionClasses()}>
            {/* Header */}
            <div className="pb-2 mb-2 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Compartilhar</h4>
              <p className="text-xs text-gray-500 mt-1">{title}</p>
            </div>

            {/* Opções de Compartilhamento */}
            <div className="space-y-2 min-w-48">
              {/* Compartilhamento Nativo */}
              {showNative && canShare && (
                <button
                  onClick={handleNativeShare}
                  disabled={isSharing}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Share2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {isSharing ? 'Compartilhando...' : 'Compartilhar'}
                  </span>
                  {isSharing && (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              )}

              {/* Copiar Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Link copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Copiar link</span>
                  </>
                )}
              </button>

              {/* Download de Imagem (se disponível) */}
              {text.includes('poster') && (
                <button
                  onClick={() => {
                    // Lógica para download de poster
                    const link = document.createElement('a');
                    link.href = text;
                    link.download = `${title}.jpg`;
                    link.click();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Baixar poster</span>
                </button>
              )}

              {/* Redes Sociais */}
              {showSocial && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-medium mb-1">Redes sociais</div>
                  <div className="grid grid-cols-3 gap-1">
                    {socialButtons.map((social) => (
                      <button
                        key={social.platform}
                        onClick={() => shareToSocial(social.platform)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title={social.label}
                      >
                        <div className="text-gray-600">
                          {social.icon}
                        </div>
                        <span className="text-xs text-gray-600">{social.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Link Direto */}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Link className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 truncate flex-1">{url}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Componente simplificado para uso rápido
export function QuickShare({ url, title }: { url?: string; title?: string }) {
  const { shareContent, canShare } = usePWA();
  const [copied, setCopied] = useState(false);

  const handleQuickShare = async () => {
    const shareUrl = url || window.location.href;
    const shareTitle = title || document.title;

    if (canShare) {
      try {
        await shareContent({
          title: shareTitle,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para copiar link
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erro ao copiar link:', error);
      }
    }
  };

  return (
    <button
      onClick={handleQuickShare}
      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      title="Compartilhar"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Share2 className="w-4 h-4 text-gray-600" />
      )}
    </button>
  );
}

// Hook personalizado para compartilhamento
export function useShare() {
  const { shareContent, canShare } = usePWA();

  const shareMovie = async (movie: {
    title: string;
    description?: string;
    url: string;
    poster?: string;
  }) => {
    const shareData = {
      title: movie.title,
      text: `Estou assistindo "${movie.title}" no CineCasa! 🎬${movie.description ? `\n\n${movie.description}` : ''}`,
      url: movie.url,
    };

    return await shareContent(shareData);
  };

  const shareToSocial = (platform: string, content: { title: string; url: string; text?: string }) => {
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}&quote=${encodeURIComponent(content.text || '')}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${content.text || content.title} ${content.url}`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${content.text || content.title} ${content.url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(content.url)}&text=${encodeURIComponent(content.text || content.title)}`,
    };

    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      
      // Analytics
      if ('gtag' in window) {
        (window as any).gtag('event', 'share_social', {
          method: platform,
          content_type: 'movie',
          item_id: content.url,
        });
      }
    }
  };

  return {
    shareMovie,
    shareToSocial,
    canShare,
    shareContent,
  };
}

export default ShareComponent;

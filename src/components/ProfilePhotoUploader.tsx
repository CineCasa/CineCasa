import { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { cn } from '@/lib/utils';

interface ProfilePhotoUploaderProps {
  userId?: string;
  profileId?: string;
  currentAvatarUrl?: string | null;
  onPhotoChange?: (url: string | null) => void;
  className?: string;
}

export function ProfilePhotoUploader({
  userId,
  profileId,
  currentAvatarUrl,
  onPhotoChange,
  className,
}: ProfilePhotoUploaderProps) {
  const { avatarUrl, isUploading, fetchAvatar, uploadPhoto, removePhoto } = useProfilePhoto({
    userId,
    profileId,
  });
  
  const [displayUrl, setDisplayUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      fetchAvatar();
    }
  }, [userId, fetchAvatar]);

  useEffect(() => {
    if (avatarUrl !== null) {
      setDisplayUrl(avatarUrl);
      onPhotoChange?.(avatarUrl);
    }
  }, [avatarUrl, onPhotoChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    console.log('📸 openCamera chamado - criando input dinâmico');
    
    // Criar input dinamicamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    // Estilos para posicionar fora da tela (não usar display: none)
    input.style.cssText = 'position: fixed; top: -9999px; left: -9999px; opacity: 0; pointer-events: none; z-index: -1;';
    
    document.body.appendChild(input);
    console.log('📸 Input adicionado ao body');
    
    // Handler para quando arquivo for selecionado
    const handleChange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      console.log('📸 Arquivo selecionado:', file?.name, 'Tamanho:', file?.size);
      if (file) {
        await uploadPhoto(file);
      }
      // Cleanup
      input.removeEventListener('change', handleChange);
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    input.addEventListener('change', handleChange);
    
    // Clicar no input após garantir que está no DOM
    requestAnimationFrame(() => {
      console.log('📸 Disparando click...');
      try {
        input.click();
        console.log('✅ Click disparado');
      } catch (err) {
        console.error('❌ Erro ao clicar:', err);
        // Cleanup em caso de erro
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }
    });
    
    // Fallback de cleanup após 30 segundos
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 30000);
  };

  const handleRemove = async () => {
    await removePhoto();
    setDisplayUrl(null);
    onPhotoChange?.(null);
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Input file escondido - Galeria */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        data-testid="gallery-input"
      />
      

      {/* Preview da foto - clicável para abrir galeria */}
      <div 
        className="relative group cursor-pointer"
        onClick={openGallery}
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden border-4 border-gray-700 group-hover:border-cyan-400 transition-colors">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-5xl">👤</div>
          )}
        </div>
        
        {/* Overlay ao hover */}
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Upload className="w-8 h-8 text-white" />
        </div>
        
        {/* Indicador de loading */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openCamera}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>Câmera</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={openGallery}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Galeria</span>
        </Button>
        
        {displayUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-400/50 hover:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remover</span>
          </Button>
        )}
      </div>

      {/* Texto informativo */}
      <p className="text-xs text-gray-400 text-center">
        Clique na foto ou em "Galeria" para escolher uma imagem
      </p>
    </div>
  );
}

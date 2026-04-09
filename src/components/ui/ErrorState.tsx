import React from 'react';
import { cva } from '@/lib/cva';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  Home,
  WifiOff,
  Database,
  Mail,
  Shield
} from 'lucide-react';

interface ErrorStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'warning' | 'error' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  code?: string;
  details?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const errorStateVariants = cva(
  'flex flex-col items-center text-center p-8 rounded-lg border',
  {
    variant: {
      default: 'bg-gray-900 border-gray-800 text-gray-300',
      warning: 'bg-yellow-900/20 border-yellow-800/50 text-yellow-300',
      error: 'bg-red-900/20 border-red-800/50 text-red-300',
      critical: 'bg-red-900/40 border-red-800 text-red-200',
    },
    size: {
      sm: 'p-4',
      md: 'p-8',
      lg: 'p-12',
    },
  },
);

export function ErrorState({
  icon,
  title,
  message,
  description,
  actions,
  variant = 'error',
  size = 'md',
  code,
  details,
  dismissible = false,
  onDismiss,
  className,
}: ErrorStateProps) {
  const iconSize = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const titleSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const messageSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const descriptionSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn(errorStateVariants({ variant, size }), className)}>
      {/* Botão de dismiss */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Ícone */}
      <div className="mb-4 flex items-center justify-center">
        <div 
          className="text-red-400"
          style={{ fontSize: `${iconSize[size]}px` }}
        >
          {icon || <AlertTriangle />}
        </div>
      </div>

      {/* Título */}
      <h3 className={cn('font-semibold mb-2', titleSize[size])}>
        {title}
      </h3>

      {/* Mensagem principal */}
      {message && (
        <p className={cn('mb-4 max-w-md', messageSize[size])}>
          {message}
        </p>
      )}

      {/* Descrição detalhada */}
      {description && (
        <p className={cn('mb-6 max-w-lg', descriptionSize[size])}>
          {description}
        </p>
      )}

      {/* Código de erro */}
      {code && (
        <div className="mb-6">
          <code className="bg-gray-800 px-3 py-1 rounded text-red-400 text-sm font-mono">
            {code}
          </code>
        </div>
      )}

      {/* Detalhes técnicos */}
      {details && (
        <details className="mb-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors mb-2">
            Ver detalhes técnicos
          </summary>
          <pre className="bg-gray-800 p-3 rounded text-xs text-gray-300 overflow-auto max-h-32">
            {details}
          </pre>
        </details>
      )}

      {/* Ações */}
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          {actions}
        </div>
      )}
    </div>
  );
}

// Error States específicos para diferentes contextos
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      variant="error"
      icon={<WifiOff />}
      title="Erro de conexão"
      message="Não foi possível conectar ao servidor."
      description="Verifique sua conexão com a internet e tente novamente."
      actions={
        <button
          onClick={onRetry}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </button>
      }
    />
  );
}

export function DatabaseError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      variant="error"
      icon={<Database />}
      title="Erro no banco de dados"
      message="Não foi possível carregar os dados."
      description="Ocorreu um erro ao acessar o banco de dados. Tente novamente em alguns instantes."
      actions={
        <button
          onClick={onRetry}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Recarregar Dados
        </button>
      }
    />
  );
}

export function AuthError({ onLogin }: { onLogin?: () => void }) {
  return (
    <ErrorState
      variant="warning"
      icon={<Shield />}
      title="Erro de autenticação"
      message="Sua sessão expirou."
      description="Por favor, faça login novamente para continuar acessando o conteúdo."
      actions={
        <button
          onClick={onLogin}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Fazer Login
        </button>
      }
    />
  );
}

export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorState
      variant="default"
      icon={<AlertCircle />}
      title="Página não encontrada"
      message="O conteúdo que você procura não está disponível."
      description="Verifique o endereço ou volte para a página inicial."
      actions={
        <button
          onClick={onGoHome}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Página Inicial
        </button>
      }
    />
  );
}

export function PermissionError({ onRequestPermission }: { onRequestPermission?: () => void }) {
  return (
    <ErrorState
      variant="warning"
      icon={<Shield />}
      title="Sem permissão"
      message="Você não tem permissão para acessar este conteúdo."
      description="Solicite as permissões necessárias para continuar."
      actions={
        <button
          onClick={onRequestPermission}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Solicitar Permissão
        </button>
      }
    />
  );
}

export function GenericError({ 
  error, 
  onRetry 
}: { 
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <ErrorState
      variant="error"
      icon={<XCircle />}
      title="Ocorreu um erro inesperado"
      message={error.message || 'Erro desconhecido'}
      code={error.code}
      dismissible={true}
      actions={
        onRetry && (
          <button
            onClick={onRetry}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </button>
        )
      }
    />
  );
}

// Error State minimal para notificações
export function ErrorMinimal({ 
  title, 
  message,
  variant = 'error' 
}: { 
  title: string;
  message?: string;
  variant?: 'default' | 'warning' | 'error';
}) {
  return (
    <ErrorState
      variant={variant}
      size="sm"
      title={title}
      message={message}
    />
  );
}

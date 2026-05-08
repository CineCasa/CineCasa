import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ errorInfo: info });
    // Log para Sentry / console em produção
    console.error('[ErrorBoundary]', error, info.componentStack);
    // Se Sentry estiver instalado: Sentry.captureException(error, { extra: info });
  }

  handleReload = () => window.location.reload();
  handleGoHome = () => { window.location.href = '/'; }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', background: '#070A10', color: '#EAF6FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif', padding: '2rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Algo deu errado
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.6 }}>
            Ocorreu um erro inesperado. Não se preocupe — seus dados estão seguros.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)',
              borderRadius: 8, padding: 16, fontSize: 12, textAlign: 'left',
              marginBottom: 24, overflow: 'auto', maxHeight: 200,
              color: '#ff8080',
            }}>
              {this.state.error.toString()}
              {'\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={this.handleReload} style={{
              background: '#00B7FF', color: 'black', border: 'none',
              borderRadius: 12, padding: '12px 24px', fontWeight: 700,
              cursor: 'pointer', fontSize: 14,
            }}>
              Recarregar página
            </button>
            <button onClick={this.handleGoHome} style={{
              background: 'rgba(255,255,255,0.1)', color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12, padding: '12px 24px', fontWeight: 700,
              cursor: 'pointer', fontSize: 14,
            }}>
              Ir para início
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

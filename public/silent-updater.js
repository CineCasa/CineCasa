/**
 * Silent Updater - Atualização automática e invisível no cliente
 * Funciona em background sem interferir na experiência do usuário
 */

class SilentUpdater {
    constructor() {
        this.updateInterval = 5 * 60 * 1000; // 5 minutos
        this.checkInterval = 2 * 60 * 1000; // 2 minutos
        this.maxRetries = 3;
        this.currentVersion = null;
        this.isUpdating = false;
        this.updateQueue = [];
        
        this.init();
    }

    init() {
        console.log('[Silent Updater] Inicializando sistema de atualização silenciosa...');
        
        // Obter versão atual
        this.getCurrentVersion();
        
        // Iniciar verificação periódica
        this.startPeriodicCheck();
        
        // Verificar atualizações pendentes
        this.checkPendingUpdates();
        
        // Configurar Service Worker para atualização
        this.setupServiceWorker();
        
        console.log('[Silent Updater] Sistema inicializado');
    }

    async getCurrentVersion() {
        try {
            const response = await fetch('/version.json', { 
                cache: 'no-cache',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const version = await response.json();
            this.currentVersion = version;
            console.log('[Silent Updater] Versão atual:', version.version);
        } catch (error) {
            console.warn('[Silent Updater] Erro ao obter versão:', error);
        }
    }

    async checkForUpdates() {
        if (this.isUpdating) {
            console.log('[Silent Updater] Atualização já em andamento');
            return;
        }

        try {
            // Verificar versão no servidor
            const response = await fetch('/version.json', { 
                cache: 'no-cache',
                headers: { 
                    'Cache-Control': 'no-cache',
                    'X-Force-Refresh': Date.now()
                }
            });
            
            const serverVersion = await response.json();
            
            if (this.isNewerVersion(serverVersion)) {
                console.log('[Silent Updater] Nova versão detectada:', serverVersion.version);
                this.queueUpdate(serverVersion);
            }
        } catch (error) {
            console.warn('[Silent Updater] Erro na verificação:', error);
        }
    }

    isNewerVersion(serverVersion) {
        if (!this.currentVersion) return true;
        
        // Comparar timestamps ou hashes
        return serverVersion.hash !== this.currentVersion.hash ||
               serverVersion.timestamp !== this.currentVersion.timestamp;
    }

    queueUpdate(versionInfo) {
        this.updateQueue.push(versionInfo);
        this.processUpdateQueue();
    }

    async processUpdateQueue() {
        if (this.updateQueue.length === 0 || this.isUpdating) return;
        
        this.isUpdating = true;
        const updateInfo = this.updateQueue.shift();
        
        try {
            await this.performSilentUpdate(updateInfo);
        } catch (error) {
            console.error('[Silent Updater] Erro na atualização:', error);
            this.handleUpdateError(error);
        } finally {
            this.isUpdating = false;
            
            // Processar próximas atualizações na fila
            if (this.updateQueue.length > 0) {
                setTimeout(() => this.processUpdateQueue(), 1000);
            }
        }
    }

    async performSilentUpdate(updateInfo) {
        console.log('[Silent Updater] Iniciando atualização silenciosa...');
        
        // 1. Pré-carregar novos recursos
        await this.preloadNewAssets();
        
        // 2. Atualizar Service Worker
        await this.updateServiceWorker();
        
        // 3. Invalidar caches antigos
        await this.invalidateOldCaches();
        
        // 4. Atualizar versão local
        this.currentVersion = updateInfo;
        
        // 5. Aplicar atualizações de runtime
        await this.applyRuntimeUpdates();
        
        console.log('[Silent Updater] Atualização concluída:', updateInfo.version);
    }

    async preloadNewAssets() {
        const assetsToPreload = [
            '/',
            '/index.html',
            '/assets/app.css',
            '/assets/app.js',
            '/version.json'
        ];

        const preloadPromises = assetsToPreload.map(async (asset) => {
            try {
                const response = await fetch(asset, { 
                    cache: 'reload',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                
                if (response.ok) {
                    // Pré-carregar em cache
                    const cache = await caches.open('silent-update-v2');
                    await cache.put(asset, response.clone());
                }
            } catch (error) {
                console.warn(`[Silent Updater] Erro no pré-carregamento de ${asset}:`, error);
            }
        });

        await Promise.allSettled(preloadPromises);
    }

    async updateServiceWorker() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            
            // Forçar verificação de atualização do Service Worker
            await registration.update();
            
            // Aguardar novo Service Worker instalar
            let retryCount = 0;
            while (retryCount < this.maxRetries) {
                if (registration.active && registration.active.state === 'activated') {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                retryCount++;
            }
        }
    }

    async invalidateOldCaches() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            const oldCaches = cacheNames.filter(name => 
                name.startsWith('silent-update-') && name !== 'silent-update-v2'
            );
            
            await Promise.all(oldCaches.map(name => caches.delete(name)));
        }
    }

    async applyRuntimeUpdates() {
        // Atualizar configurações em tempo de execução
        if (window.appConfig) {
            try {
                const response = await fetch('/config.json', { cache: 'no-cache' });
                const newConfig = await response.json();
                Object.assign(window.appConfig, newConfig);
            } catch (error) {
                console.warn('[Silent Updater] Erro ao atualizar configurações:', error);
            }
        }

        // Disparar evento de atualização para outros componentes
        window.dispatchEvent(new CustomEvent('silentUpdateComplete', {
            detail: { version: this.currentVersion }
        }));
    }

    handleUpdateError(error) {
        console.error('[Silent Updater] Erro na atualização:', error);
        
        // Tentar recuperação automática
        setTimeout(() => {
            console.log('[Silent Updater] Tentando recuperação automática...');
            this.checkForUpdates();
        }, 30000); // 30 segundos
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('[Silent Updater] Service Worker registrado');
                
                // Escutar atualizações do Service Worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Novo Service Worker disponível, mas não recarregar a página
                            console.log('[Silent Updater] Novo Service Worker disponível');
                            
                            // Aguardar momento oportuno para ativação
                            this.scheduleWorkerActivation(newWorker);
                        }
                    });
                });
            }).catch(error => {
                console.warn('[Silent Updater] Erro no Service Worker:', error);
            });
        }
    }

    scheduleWorkerActivation(newWorker) {
        // Aguardar usuário estar inativo ou página em background
        const checkInactivity = () => {
            if (document.hidden || this.isUserIdle()) {
                // Ativar novo Service Worker
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                console.log('[Silent Updater] Service Worker ativado silenciosamente');
            } else {
                // Tentar novamente em 1 minuto
                setTimeout(checkInactivity, 60000);
            }
        };
        
        setTimeout(checkInactivity, 30000); // Primeira verificação em 30 segundos
    }

    isUserIdle() {
        // Verificar se há atividade recente do usuário
        const lastActivity = localStorage.getItem('lastUserActivity');
        if (!lastActivity) return false;
        
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        return timeSinceActivity > 60000; // 1 minuto de inatividade
    }

    startPeriodicCheck() {
        // Verificar atualizações periodicamente
        setInterval(() => {
            this.checkForUpdates();
        }, this.checkInterval);
    }

    async checkPendingUpdates() {
        // Verificar se há atualizações pendentes ao iniciar
        try {
            const response = await fetch('/api/updates/pending', { cache: 'no-cache' });
            if (response.ok) {
                const pending = await response.json();
                if (pending.hasUpdates) {
                    this.queueUpdate(pending.version);
                }
            }
        } catch (error) {
            // Silenciar erros na verificação inicial
        }
    }

    // Método público para forçar verificação
    forceCheck() {
        console.log('[Silent Updater] Verificação forçada');
        this.checkForUpdates();
    }

    // Método público para obter status
    getStatus() {
        return {
            currentVersion: this.currentVersion,
            isUpdating: this.isUpdating,
            queueLength: this.updateQueue.length,
            lastCheck: new Date().toISOString()
        };
    }
}

// Inicializar sistema automaticamente
let silentUpdater = null;

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        silentUpdater = new SilentUpdater();
    });
} else {
    silentUpdater = new SilentUpdater();
}

// Monitorar atividade do usuário para ativação silenciosa
document.addEventListener('click', () => {
    localStorage.setItem('lastUserActivity', Date.now().toString());
});

document.addEventListener('keypress', () => {
    localStorage.setItem('lastUserActivity', Date.now().toString());
});

document.addEventListener('scroll', () => {
    localStorage.setItem('lastUserActivity', Date.now().toString());
});

// Expor API global para debugging (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    window.silentUpdater = silentUpdater;
}

export default SilentUpdater;

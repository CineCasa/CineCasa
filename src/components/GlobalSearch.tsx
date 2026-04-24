import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, MicOff, X, Film, PlaySquare, Users, Calendar, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import getSupabaseClient from '../lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year?: string;
  rating?: string;
  category?: string;
  description?: string;
  table: 'cinema' | 'series';
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'modal' | 'dropdown';
  navbarHeight?: number;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, variant = 'dropdown', navbarHeight = 64 }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);

  const supabase = getSupabaseClient();

  // Carregar histórico de pesquisa
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Salvar histórico de pesquisa
  const saveToHistory = (searchQuery: string) => {
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Pesquisa em tempo real
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [cinemaResults, seriesResults] = await Promise.all([
        supabase
          .from('cinema')
          .select('*')
          .ilike('titulo', searchQuery + '%')
          .limit(10),
        supabase
          .from('series')
          .select('*')
          .ilike('titulo', searchQuery + '%')
          .limit(10)
      ]);

      const allResults: SearchResult[] = [
        ...(cinemaResults.data || []).map((item: any) => ({
          id: item.id?.toString(),
          title: item.titulo || item.title || '',
          poster: item.poster || '/api/placeholder/300/450',
          type: 'movie' as const,
          year: item.ano?.toString() || item.year,
          rating: item.nota?.toString() || item.rating,
          category: item.category,
          description: item.description || item.sinopse || '',
          table: 'cinema' as const
        })),
        ...(seriesResults.data || []).map((item: any) => ({
          id: item.id_n?.toString() || item.id?.toString() || '',
          title: item.titulo || item.title || '',
          poster: item.capa || item.poster || '/api/placeholder/300/450',
          type: 'series' as const,
          year: item.ano?.toString(),
          rating: item.rating?.toString() || item.nota?.toString(),
          category: item.genero || item.category,
          description: item.sinopse || item.description,
          table: 'series' as const
        }))
      ];

      setResults(allResults);
    } catch (error) {
      console.error('Erro na pesquisa:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para pesquisa em tempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Configurar reconhecimento de voz
  useEffect(() => {
    const initSpeechRecognition = () => {
      // Verificar suporte ao navegador
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                               (window as any).SpeechRecognition || 
                               (window as any).mozSpeechRecognition ||
                               (window as any).msSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn('Navegador não suporta reconhecimento de voz');
        return;
      }

      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onstart = () => {
          console.log('🎤 Iniciando reconhecimento de voz...');
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('🎤 Resultado:', transcript);
          setQuery(transcript);
          saveToHistory(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('❌ Erro no reconhecimento de voz:', event.error);
          setIsListening(false);
          
          // Mensagens amigáveis para diferentes erros
          let errorMessage = 'Erro na pesquisa por voz';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'Nenhum áudio detectado. Tente novamente.';
              break;
            case 'audio-capture':
              errorMessage = 'Microfone não encontrado ou bloqueado.';
              break;
            case 'not-allowed':
              errorMessage = 'Permissão para usar o microfone foi negada.';
              break;
            case 'network':
              errorMessage = 'Erro de conexão. Verifique sua internet.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Serviço de reconhecimento de voz não disponível.';
              break;
            default:
              errorMessage = `Erro: ${event.error}`;
          }
          
          // Mostrar toast ou alerta (simples por enquanto)
          console.error(errorMessage);
        };

        recognitionRef.current.onend = () => {
          console.log('🎤 Reconhecimento de voz finalizado');
          setIsListening(false);
        };

        recognitionRef.current.onspeechstart = () => {
          console.log('🎤 Detectando fala...');
        };

        recognitionRef.current.onspeechend = () => {
          console.log('🎤 Fala finalizada');
        };

        console.log('✅ Reconhecimento de voz configurado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao configurar reconhecimento de voz:', error);
      }
    };

    initSpeechRecognition();
  }, []);

  // Iniciar/parar reconhecimento de voz
  const toggleVoiceSearch = async () => {
    // Verificar suporte
    if (!recognitionRef.current) {
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      const isEdge = /Edg/.test(navigator.userAgent);
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
      const isLocalIP = window.location.hostname.startsWith('192.168.') ||
                       window.location.hostname.startsWith('10.') ||
                       window.location.hostname.startsWith('172.');
      
      let message = 'Seu navegador não suporta pesquisa por voz.';
      
      if (isChrome || isEdge) {
        message = 'Para usar a pesquisa por voz:\n\n';
        
        if (isLocalIP) {
          message += '⚠️ REDE LOCAL DETECTADA\n';
          message += 'A pesquisa por voz pode não funcionar em redes locais.\n\n';
          message += 'Soluções:\n';
          message += '1. Acesse via localhost:5173 em vez de ' + window.location.hostname + ':5173\n';
          message += '2. Use Chrome com permissões de microfone\n';
          message += '3. Configure o servidor para HTTPS\n\n';
        } else if (!isLocalhost && !window.location.protocol.includes('https')) {
          message += '⚠️ HTTPS NECESSÁRIO\n';
          message += 'A pesquisa por voz requer HTTPS.\n\n';
          message += 'Soluções:\n';
          message += '1. Use localhost:5173 (já permitido)\n';
          message += '2. Configure certificado HTTPS\n';
          message += '3. Use ngrok ou similar para tunnel HTTPS\n\n';
        } else {
          message += '1. Verifique se o microfone está conectado\n';
          message += '2. Permita o acesso ao microfone quando solicitado\n';
          message += '3. Use HTTPS (localhost já é permitido)\n';
        }
      } else {
        message = 'Pesquisa por voz funciona melhor no Chrome ou Edge.\n\n';
        message += 'Navegadores recomendados:\n';
        message += '• Google Chrome\n';
        message += '• Microsoft Edge\n\n';
        message += 'Firefox tem suporte limitado.';
      }
      
      alert(message);
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        // Verificar se estamos em HTTP vs HTTPS
        const isSecure = window.location.protocol === 'https:' || 
                        window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';
        
        if (!isSecure) {
          const isLocalIP = window.location.hostname.startsWith('192.168.') ||
                           window.location.hostname.startsWith('10.') ||
                           window.location.hostname.startsWith('172.');
          
          if (isLocalIP) {
            const message = '⚠️ PESQUISA POR VOZ BLOQUEADA\n\n' +
                           'Você está acessando via rede local (' + window.location.hostname + ')\n' +
                           'O navegador bloqueia o microfone em HTTP para redes locais.\n\n' +
                           'SOLUÇÕES:\n' +
                           '1. Acesse via: http://localhost:5173\n' +
                           '2. Configure servidor HTTPS\n' +
                           '3. Use ngrok: ngrok http 5173\n\n' +
                           'localhost sempre funciona!';
            alert(message);
            return;
          }
        }
        
        // Verificar permissões antes de iniciar
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true,
            video: false 
          });
          
          // Parar o stream (só precisamos verificar permissão)
          stream.getTracks().forEach(track => track.stop());
          
          console.log('✅ Microfone liberado, iniciando reconhecimento...');
          
          // Iniciar reconhecimento com timeout
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              recognitionRef.current.start();
            }
          }, 100);
          
        } catch (error: any) {
          console.error('❌ Erro ao acessar microfone:', error);
          
          let errorMessage = 'Não foi possível acessar o microfone.\n\n';
          
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage += 'Permissão negada.\n\n';
            errorMessage += 'SOLUÇÃO:\n';
            errorMessage += '1. Clique no ícone de cadeado 🔒 na barra de endereço\n';
            errorMessage += '2. Permita "Usar microfone"\n';
            errorMessage += '3. Recarregue a página\n';
            errorMessage += '4. Tente novamente';
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage += 'Nenhum microfone encontrado.\n\n';
            errorMessage += 'SOLUÇÃO:\n';
            errorMessage += '1. Conecte um microfone\n';
            errorMessage += '2. Verifique se está funcionando\n';
            errorMessage += '3. Tente novamente';
          } else if (error.name === 'NotSupportedError' || error.name === 'ConstraintNotSatisfiedError') {
            errorMessage += 'Microfone não suportado.\n\n';
            errorMessage += 'SOLUÇÃO:\n';
            errorMessage += '1. Tente outro microfone\n';
            errorMessage += '2. Verifique drivers\n';
            errorMessage += '3. Use outro navegador';
          } else {
            errorMessage += 'Erro desconhecido: ' + error.message + '\n\n';
            errorMessage += 'Tente:\n';
            errorMessage += '1. Usar localhost:5173\n';
            errorMessage += '2. Permitir microfone\n';
            errorMessage += '3. Recarregar a página';
          }
          
          alert(errorMessage);
          setIsListening(false);
          return;
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao iniciar pesquisa por voz:', error);
      setIsListening(false);
      
      let errorMessage = 'Não foi possível iniciar a pesquisa por voz.\n\n';
      
      if (error.message && error.message.includes('blocked')) {
        errorMessage += 'Microfone bloqueado.\n\n';
        errorMessage += 'SOLUÇÃO:\n';
        errorMessage += '1. Permita acesso ao microfone\n';
        errorMessage += '2. Use localhost:5173\n';
        errorMessage += '3. Recarregue a página';
      } else if (error.message && error.message.includes('not found')) {
        errorMessage += 'Nenhum microfone encontrado.\n\n';
        errorMessage += 'SOLUÇÃO:\n';
        errorMessage += '1. Conecte um microfone\n';
        errorMessage += '2. Verifique se está funcionando';
      } else if (error.message && error.message.includes('not allowed')) {
        errorMessage += 'Permissão negada.\n\n';
        errorMessage += 'SOLUÇÃO:\n';
        errorMessage += '1. Clique no cadeado 🔒 na barra de endereço\n';
        errorMessage += '2. Permita "Usar microfone"\n';
        errorMessage += '3. Recarregue a página';
      } else {
        errorMessage += 'Erro: ' + (error.message || error.toString()) + '\n\n';
        errorMessage += 'SUGESTÕES:\n';
        errorMessage += '1. Use localhost:5173 em vez de ' + window.location.hostname + ':5173\n';
        errorMessage += '2. Use navegador Chrome\n';
        errorMessage += '3. Verifique o microfone';
      }
      
      alert(errorMessage);
    }
  };

  // Lidar com clique no resultado
  const handleResultClick = (result: SearchResult) => {
    const typePath = result.table === 'cinema' ? 'cinema' : 'series';
    navigate(`/details/${typePath}/${result.id}`);
    onClose();
    saveToHistory(query);
  };

  // Limpar pesquisa
  const clearSearch = useCallback(() => {
    console.log('[GlobalSearch] Limpando pesquisa');
    setQuery('');
    setResults([]);
    // Focar no input após limpar
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Render dropdown variant (below navbar)
  if (variant === 'dropdown') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed left-0 right-0 z-[115] bg-[#0f171e]/95 backdrop-blur-md border-b border-white/10 shadow-2xl"
        style={{ top: `${navbarHeight}px` }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Campo de Pesquisa */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                <Search size={20} className="text-secondary" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onClose();
                  } else if (e.key === 'Enter' && results.length > 0) {
                    handleResultClick(results[0]);
                  }
                }}
                placeholder="Buscar filmes, séries, atores..."
                className="flex-1 bg-transparent text-primary placeholder-secondary focus:outline-none text-lg py-2"
              />
              <button
                onClick={toggleVoiceSearch}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'hover:bg-white/10 text-secondary'
                }`}
                title="Pesquisar por voz"
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                onClick={clearSearch}
                disabled={!query}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                  query
                    ? 'hover:bg-white/10 text-secondary opacity-100'
                    : 'text-secondary opacity-0 pointer-events-none'
                }`}
                title="Limpar pesquisa"
              >
                <X size={20} />
              </button>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary transition-all duration-300"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            {isListening && (
              <div className="mt-2 flex items-center justify-center space-x-2 text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-sm">Ouvindo...</span>
              </div>
            )}
          </div>

          {/* Resultados da Pesquisa */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="p-8 text-center text-secondary">
                <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
                <p>Pesquisando...</p>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center text-secondary">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum resultado encontrado para "{query}"</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="p-4 max-w-4xl mx-auto">
                <p className="text-sm text-secondary mb-4">
                  {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.map((result, index) => (
                    <motion.div
                      key={`${result.table}-${result.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-300"
                      onClick={() => handleResultClick(result)}
                    >
                      <img
                        src={result.poster}
                        alt={result.title}
                        className="w-14 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/300/450';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {result.type === 'movie' ? (
                            <Film size={14} className="text-accent" />
                          ) : (
                            <PlaySquare size={14} className="text-accent" />
                          )}
                          <h3 className="text-primary font-medium truncate text-sm">{result.title}</h3>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-secondary">
                          {result.year && <span>{result.year}</span>}
                          {result.rating && (
                            <span className="flex items-center space-x-1">
                              <Star size={10} className="text-yellow-500 fill-current" />
                              <span>{result.rating}</span>
                            </span>
                          )}
                        </div>
                        {result.category && (
                          <p className="text-xs text-secondary/70 truncate mt-1">{result.category}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Pesquisa */}
            {!query && !loading && searchHistory.length > 0 && (
              <div className="p-4 max-w-4xl mx-auto border-t border-white/10">
                <p className="text-sm text-secondary mb-3">Pesquisas recentes</p>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(item)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 text-sm text-secondary"
                    >
                      <Search size={14} />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Modal variant (original centered)
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative max-w-4xl mx-auto mt-20 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-navbar rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
          {/* Campo de Pesquisa - Fixo no topo */}
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Ícone de Pesquisa - Alinhado à esquerda */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                <Search size={20} className="text-secondary" />
              </div>
              
              {/* Input de pesquisa - Ocupa espaço restante */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onClose();
                  } else if (e.key === 'Enter' && results.length > 0) {
                    handleResultClick(results[0]);
                  }
                }}
                placeholder="Buscar filmes, séries, atores..."
                className="flex-1 min-w-0 bg-transparent text-primary placeholder-secondary focus:outline-none text-base py-2"
              />
              
              {/* Botão de Voz - Tamanho fixo para touch */}
              <button
                onClick={toggleVoiceSearch}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'hover:bg-white/10 text-secondary'
                }`}
                title="Pesquisar por voz"
                tabIndex={0}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Botão Limpar - Sempre visível quando há texto, tamanho fixo */}
              <button
                onClick={clearSearch}
                disabled={!query}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                  query 
                    ? 'hover:bg-white/10 text-secondary opacity-100' 
                    : 'text-secondary opacity-0 pointer-events-none'
                }`}
                title="Limpar pesquisa"
                tabIndex={0}
              >
                <X size={20} />
              </button>
            </div>

            {/* Indicador de gravação */}
            {isListening && (
              <div className="mt-3 flex items-center space-x-2 text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-sm">Ouvindo...</span>
              </div>
            )}
          </div>

          {/* Resultados da Pesquisa - Área rolável */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {loading && (
              <div className="p-8 text-center text-secondary">
                <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
                <p>Pesquisando...</p>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center text-secondary">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum resultado encontrado para "{query}"</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="p-4">
                <p className="text-sm text-secondary mb-4">
                  {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </p>
                
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <motion.div
                      key={`${result.table}-${result.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-300 focus:bg-white/5 focus:outline-none"
                      onClick={() => handleResultClick(result)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleResultClick(result);
                        }
                      }}
                    >
                      {/* Poster */}
                      <img
                        src={result.poster}
                        alt={result.title}
                        className="w-16 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/300/450';
                        }}
                      />

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {result.type === 'movie' ? (
                            <Film size={16} className="text-accent" />
                          ) : (
                            <PlaySquare size={16} className="text-accent" />
                          )}
                          <h3 className="text-primary font-medium truncate">{result.title}</h3>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-secondary mb-2">
                          {result.year && <span>{result.year}</span>}
                          {result.rating && (
                            <span className="flex items-center space-x-1">
                              <Star size={12} className="text-yellow-500 fill-current" />
                              <span>{result.rating}</span>
                            </span>
                          )}
                          {result.category && <span>{result.category}</span>}
                        </div>

                        {result.description && (
                          <p className="text-xs text-secondary line-clamp-2">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Pesquisa */}
            {!query && !loading && searchHistory.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <p className="text-sm text-secondary mb-3">Pesquisas recentes</p>
                <div className="space-y-2">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(item)}
                      className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-white/5 transition-all duration-300 text-left"
                    >
                      <Search size={16} className="text-secondary" />
                      <span className="text-secondary">{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalSearch;

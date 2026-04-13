import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useImageCleanup from '../hooks/useImageCleanup';
import { 
  Database, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Image as ImageIcon,
  RefreshCw,
  Play,
  Info
} from 'lucide-react';

const ImageCleanup: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTable, setSelectedTable] = useState<'all' | 'cinema' | 'series'>('all');
  
  const { isScanning, stats, runFullCleanup, scanForOrphanedImages } = useImageCleanup();

  const handleQuickCleanup = async () => {
    await runFullCleanup();
  };

  const handleScanOrphaned = async () => {
    await scanForOrphanedImages();
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const getSeverityColor = (count: number): string => {
    if (count === 0) return 'text-green-500';
    if (count < 10) return 'text-yellow-500';
    if (count < 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getSeverityBg = (count: number): string => {
    if (count === 0) return 'bg-green-500/10';
    if (count < 10) return 'bg-yellow-500/10';
    if (count < 50) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="min-h-screen bg-black text-white pt-[94px] px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            🧹 Limpeza de Imagens
          </h1>
          <p className="text-gray-400 text-lg">
            Sistema de limpeza e otimização do banco de dados
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Verificado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Database className="text-blue-400" size={24} />
                <h3 className="text-lg font-semibold text-white">Total Verificado</h3>
              </div>
              <div className={`text-2xl font-bold ${getSeverityColor(stats.totalChecked)}`}>
                {formatNumber(stats.totalChecked)}
              </div>
            </div>
            <div className={`h-2 rounded-full ${getSeverityBg(stats.totalChecked)}`}></div>
          </motion.div>

          {/* Imagens Inválidas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-400" size={24} />
                <h3 className="text-lg font-semibold text-white">Imagens Inválidas</h3>
              </div>
              <div className={`text-2xl font-bold ${getSeverityColor(stats.invalidFound)}`}>
                {formatNumber(stats.invalidFound)}
              </div>
            </div>
            <div className={`h-2 rounded-full ${getSeverityBg(stats.invalidFound)}`}></div>
          </motion.div>

          {/* Limpas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={24} />
                <h3 className="text-lg font-semibold text-white">Limpas</h3>
              </div>
              <div className={`text-2xl font-bold ${getSeverityColor(stats.cleaned)}`}>
                {formatNumber(stats.cleaned)}
              </div>
            </div>
            <div className={`h-2 rounded-full ${getSeverityBg(stats.cleaned)}`}></div>
          </motion.div>

          {/* Erros */}
          {stats.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gray-900 rounded-lg p-6 border border-red-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-400" size={24} />
                  <h3 className="text-lg font-semibold text-white">Erros</h3>
                </div>
                <div className="text-2xl font-bold text-red-500">
                  {stats.errors.length}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleQuickCleanup}
              disabled={isScanning}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Limpando...</span>
                </>
              ) : (
                <>
                  <Trash2 size={20} />
                  <span>Limpeza Completa</span>
                </>
              )}
            </button>

            <button
              onClick={handleScanOrphaned}
              disabled={isScanning}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <Search className="animate-spin" size={20} />
                  <span>Procurando...</span>
                </>
              ) : (
                <>
                  <Search size={20} />
                  <span>Buscar Órfãs</span>
                </>
              )}
            </button>
          </div>

          {/* Table Filter */}
          <div className="flex items-center gap-4">
            <label className="text-gray-400 text-sm">Filtrar por tabela:</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value as any)}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todas as Tabelas</option>
              <option value="cinema">Apenas Cinema</option>
              <option value="series">Apenas Séries</option>
            </select>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.totalChecked > 0 && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8"
          >
            <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 transition-all duration-500"
                style={{ 
                  width: stats.totalChecked > 0 
                    ? `${((stats.cleaned + stats.invalidFound) / stats.totalChecked) * 100}%` 
                    : '0%' 
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Error Messages */}
        {stats.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4"
          >
            <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              Erros Encontrados:
            </h4>
            <ul className="text-red-300 text-sm space-y-1">
              {stats.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Success Message */}
        {!isScanning && stats.cleaned > 0 && stats.errors.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-green-900/20 border border-green-800 rounded-lg p-6 text-center"
          >
            <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
            <h3 className="text-green-400 text-xl font-bold mb-2">
              Limpeza Concluída com Sucesso!
            </h3>
            <p className="text-green-300">
              {formatNumber(stats.cleaned)} imagens foram processadas.
              {stats.invalidFound > 0 && ` ${formatNumber(stats.invalidFound)} imagens inválidas foram removidas.`}
            </p>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-gray-900 rounded-lg p-6 border border-gray-800"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="text-blue-400" size={20} />
            Como Funciona:
          </h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-yellow-400">1.</span>
              <span><strong>Limpeza Completa:</strong> Remove automaticamente placeholders, imagens quebradas e conteúdo inválido.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-400">2.</span>
              <span><strong>Busca Órfãs:</strong> Encontra imagens sem registro correspondente.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-400">3.</span>
              <span><strong>Substituição TMDB:</strong> Tenta encontrar imagens reais do TMDB antes de remover.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-400">4.</span>
              <span><strong>Relatório Detalhado:</strong> Gera estatísticas completas do processo.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-400">5.</span>
              <span><strong>Segurança:</strong> Apenas remove conteúdo confirmado como inválido.</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="text-yellow-400" size={16} />
              Cuidado:
            </h4>
            <ul className="text-yellow-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Faça backup do banco antes de executar a limpeza.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Verifique o relatório antes de confirmar as remoções.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Imagens inválidas serão marcadas para análise antes da remoção.</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Play size={20} className="rotate-180" />
            Voltar para Início
          </button>
        </div>
    </div>
  );
};

export default ImageCleanup;

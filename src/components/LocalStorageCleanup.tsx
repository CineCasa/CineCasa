import { useState } from 'react';
import { cleanupLocalStorage, clearDataCache, clearTempData, getLocalStorageInfo } from '@/lib/localStorageCleanup';

export function LocalStorageCleanup() {
  const [result, setResult] = useState<{type: 'full'|'cache'|'temp'|null; removed: string[]; totalRemoved: number}|null>(null);

  const handleFull = () => { const r = cleanupLocalStorage(); setResult({type:'full',removed:r.removed,totalRemoved:r.totalRemoved}); };
  const handleCache = () => { const r = clearDataCache(); setResult({type:'cache',removed:r.removed,totalRemoved:r.totalRemoved}); };
  const handleTemp = () => { const r = clearTempData(); setResult({type:'temp',removed:r.removed,totalRemoved:r.totalRemoved}); };
  const info = getLocalStorageInfo();

  return (
    <div className="bg-[#141414] rounded-lg p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Limpar LocalStorage</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[#0a0a0a] rounded p-3 text-center"><div className="text-xl font-bold text-white">{info.totalKeys}</div><div className="text-xs text-gray-400">Total</div></div>
        <div className="bg-[#0a0a0a] rounded p-3 text-center"><div className="text-xl font-bold text-green-400">{info.protectedKeys.length}</div><div className="text-xs text-gray-400">Protegidas</div></div>
        <div className="bg-[#0a0a0a] rounded p-3 text-center"><div className="text-xl font-bold text-orange-400">{info.cleanableKeys.length}</div><div className="text-xs text-gray-400">Limpáveis</div></div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button onClick={handleCache} className="p-3 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 rounded text-sm text-white">Limpar Cache</button>
        <button onClick={handleTemp} className="p-3 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 rounded text-sm text-white">Limpar Temp</button>
        <button onClick={handleFull} className="p-3 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 rounded text-sm text-red-200">Limpar Tudo</button>
      </div>
      {result && (
        <div className="bg-[#0a0a0a] rounded p-3">
          <div className="text-sm text-green-400 mb-2">Removidas: {result.totalRemoved} chaves</div>
          {result.removed.length > 0 && (
            <div className="text-xs text-gray-400 max-h-32 overflow-y-auto">
              {result.removed.map(k => <div key={k}>{k}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

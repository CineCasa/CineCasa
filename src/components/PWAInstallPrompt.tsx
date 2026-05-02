import React, { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-900 p-4 rounded-lg z-50">
      <p className="text-white font-medium">Instalar CineCasa</p>
      <p className="text-gray-400 text-sm">Adicione à tela inicial para acesso rápido</p>
      <button
        onClick={() => setShow(false)}
        className="mt-2 w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded"
      >
        Fechar
      </button>
    </div>
  );
}

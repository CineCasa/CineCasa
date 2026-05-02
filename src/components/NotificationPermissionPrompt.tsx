import React from 'react';

export function NotificationPermissionPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Ativar Notificações</h2>
        <p className="text-gray-300 mb-4">Receba alertas sobre novos conteúdos</p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded"
          >
            Ativar
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

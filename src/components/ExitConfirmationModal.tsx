import React from 'react';

export function ExitConfirmationModal({
  isOpen,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-sm text-center">
        <h2 className="text-xl font-bold text-white mb-4">Sair do App</h2>
        <p className="text-gray-300 mb-6">Deseja realmente sair?</p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded"
          >
            Sair
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

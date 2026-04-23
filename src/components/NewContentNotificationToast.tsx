import React from 'react';

// DESATIVADO: Notificações só devem aparecer na página de notificações
// Não mostrar toast flutuantes em outras páginas
interface NewContentNotificationToastProps {
  className?: string;
}

export const NewContentNotificationToast: React.FC<NewContentNotificationToastProps> = () => {
  // Retorna null para não renderizar nada
  // As notificações devem aparecer apenas na página /notifications
  return null;
};

export default NewContentNotificationToast;

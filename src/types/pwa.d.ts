export {};

declare global {
  interface Window {
    deferredPrompt?: {
      prompt: () => Promise<{
        outcome: 'accepted' | 'dismissed';
      }>;
    };
  }
}

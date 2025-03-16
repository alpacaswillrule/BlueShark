// Add global type declarations for window.google
interface Window {
  google?: {
    maps?: {
      Map?: any;
      event?: {
        clearInstanceListeners: (instance: any) => void;
        clearListeners: (instance: any, eventName: string) => void;
      };
    };
  };
}

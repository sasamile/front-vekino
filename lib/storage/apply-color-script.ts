/**
 * Script que se ejecuta antes de React para aplicar el color primario desde localStorage
 * Esto evita el flash del color por defecto
 */
export const applyColorScript = `
(function() {
  try {
    const hostname = window.location.hostname;
    let subdomain = null;
    
    // Detectar subdomain
    const isLocalhost = hostname.includes('localhost');
    if (isLocalhost) {
      const parts = hostname.split('.');
      if (parts.length > 1 && parts[0] !== 'localhost') {
        subdomain = parts[0];
      }
    } else {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        subdomain = parts[0];
      }
    }
    
    if (subdomain) {
      const storageKey = 'vekino_condominio_' + subdomain;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.primaryColor) {
            const root = document.documentElement;
            const hex = data.primaryColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            root.style.setProperty('--primary', data.primaryColor);
            root.style.setProperty('--primary-foreground', '#ffffff');
            root.style.setProperty('--primary-rgb', r + ', ' + g + ', ' + b);
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      }
    }
  } catch (e) {
    // Ignorar errores
  }
})();
`;

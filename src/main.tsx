// Import polyfills first
import './utils/global-polyfills';
import './utils/runtime-polyfills';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🎯 Main.tsx executing...');

const rootElement = document.getElementById('root');
console.log('🎯 Root element:', rootElement);

if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

try {
  const root = createRoot(rootElement);
  console.log('✅ React root created successfully');
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Error rendering app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: red;">Application Error</h1>
      <p>There was an error loading the application:</p>
      <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  `;
}

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs'; // Import the file system module
import path from 'path'; // Import the path module

// Define the path to your certificates relative to this config file
// These should be in your project root now
const certPath = path.resolve(__dirname, '../localhost+2.pem');
const keyPath = path.resolve(__dirname, '../localhost+2-key.pem');

// Check if certificate files exist
const httpsOptions =
  fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    : false;

if (!httpsOptions) {
  console.warn(
    'HTTPS certificates not found at project root. Running Vite in HTTP mode. Ensure localhost+2.pem and localhost+2-key.pem are in the root.'
  );
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/hobbyist-client/' : '/',
  plugins: [react()],
  server: {
    // Only configure HTTPS if certificates were found
    https: httpsOptions, // Use the generated options
    port: 5173, // Keep the port consistent
    proxy: {
      '/api': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false, // Accept self-signed certs for local dev
      },
    },
  },
}));

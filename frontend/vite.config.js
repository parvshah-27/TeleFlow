import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig(() => {
  // Try to read actual port from backend_port.txt
  const portFilePath = path.resolve(__dirname, '../backend_port.txt');
  const backendEnvPath = path.resolve(__dirname, '../backend/.env');
  
  let backendPort = '5001'; // Default fallback

  if (fs.existsSync(portFilePath)) {
    try {
      backendPort = fs.readFileSync(portFilePath, 'utf8').trim();
      console.log(`Using backend port from ${portFilePath}: ${backendPort}`);
    } catch (err) {
      console.warn(`Error reading ${portFilePath}:`, err.message);
    }
  } else if (fs.existsSync(backendEnvPath)) {
    try {
      const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
      const portMatch = backendEnv.match(/^PORT=(\d+)/m);
      if (portMatch) {
        backendPort = portMatch[1];
        console.log(`Using backend port from ${backendEnvPath}: ${backendPort}`);
      }
    } catch (err) {
      console.warn(`Error reading ${backendEnvPath}:`, err.message);
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        }
      }
    }
  };
});

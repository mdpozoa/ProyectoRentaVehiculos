const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ZenithDrive LocalTunnel Watchdog (FIJO) iniciado\n   Presiona Ctrl+C para detener\n');

const CLIENT_TS_PATH = path.join(__dirname, 'mobile-app/src/api/client.ts');
const ENV_PATH = path.join(__dirname, 'mobile-app/.env');

let currentUrl = null;

function updateFiles(newUrl) {
  if (newUrl === currentUrl) return;
  currentUrl = newUrl;
  
  console.log(`\n[${new Date().toLocaleTimeString()}] 🌐 Nuevo túnel FIJO detectado: ${newUrl}`);

  try {
    let clientTs = fs.readFileSync(CLIENT_TS_PATH, 'utf-8');
    clientTs = clientTs.replace(
      /export const API_BASE_URL = process\.env\.EXPO_PUBLIC_API_URL \|\| 'https:\/\/[^']+';/,
      `export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '${newUrl}';`
    );
    fs.writeFileSync(CLIENT_TS_PATH, clientTs, 'utf-8');
    console.log('✅ mobile-app/src/api/client.ts actualizado con URL FIJA');

    if (fs.existsSync(ENV_PATH)) {
      let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
      envContent = envContent.replace(
        /EXPO_PUBLIC_API_URL=https:\/\/[^\s]+/,
        `EXPO_PUBLIC_API_URL=${newUrl}`
      );
      if (!envContent.includes('EXPO_PUBLIC_API_URL=')) {
        envContent += `\nEXPO_PUBLIC_API_URL=${newUrl}\n`;
      }
      fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
      console.log('✅ mobile-app/.env actualizado con URL FIJA');
    }
    
    console.log('⚠️  SI TENÍAS EXPO CORRIENDO, DEBES REINICIARLO PARA QUE TOME ESTE CAMBIO');
  } catch (err) {
    console.error('❌ Error al actualizar archivos:', err.message);
  }
}

function startTunnel() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🌐 Iniciando localtunnel con dominio FIJO "mateobooking"...`);
  
  // npx localtunnel --port 80 --subdomain mateobooking
  const tunnel = spawn('npx localtunnel --port 80 --subdomain mateobooking', { shell: true });

  tunnel.stdout.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/);
    if (match) {
      updateFiles(match[0]);
    } else {
      console.log(`[LT] ${text.trim()}`);
    }
  });

  tunnel.stderr.on('data', (data) => {
    console.error(`[LT ERROR] ${data.toString().trim()}`);
  });

  tunnel.on('close', (code) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] ⚠️  LocalTunnel cerrado (código: ${code}). Reiniciando en 5s...`);
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();

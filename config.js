require('dotenv').config();

module.exports = {
  // Puerto local a reenviar
  localPort: process.env.LOCAL_PORT || 8080,
  
  // Dominio personalizado (opcional, si lo tienes)
  subdomain: process.env.SUBDOMAIN || null,
  
  // Configuración de reconexión
  reconnectDelay: parseInt(process.env.RECONNECT_DELAY || '5000'), // 5 segundos
  maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '0'), // 0 = infinito
  
  // Verificación de puerto local
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 segundos
  localHost: process.env.LOCAL_HOST || 'localhost',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};

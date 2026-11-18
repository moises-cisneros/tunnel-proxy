const localtunnel = require('localtunnel');
const axios = require('axios');
const winston = require('winston');
const config = require('./config');

// Configurar logger
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'tunnel.log' })
  ]
});

class PersistentTunnel {
  constructor() {
    this.tunnel = null;
    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.checkingLocalPort = false;
  }

  // Verificar si el puerto local está disponible
  async isLocalPortAvailable() {
    try {
      const response = await axios.get(`http://${config.localHost}:${config.localPort}`, {
        timeout: 5000,
        validateStatus: () => true // Aceptar cualquier respuesta
      });
      
      // Si obtenemos alguna respuesta (incluso error 404), el puerto está activo
      if (response.status !== undefined) {
        logger.info(`✅ Puerto local ${config.localPort} está disponible`);
        return true;
      }
      return false;
    } catch (error) {
      // Si hay error de conexión, el puerto no está disponible
      if (error.code === 'ECONNREFUSED') {
        logger.warn(`⚠️ Puerto local ${config.localPort} no está disponible (conexión rechazada)`);
      } else if (error.code === 'ETIMEDOUT') {
        logger.warn(`⚠️ Puerto local ${config.localPort} no responde (timeout)`);
      } else {
        logger.warn(`⚠️ Error verificando puerto local: ${error.message}`);
      }
      return false;
    }
  }

  // Esperar hasta que el puerto local esté disponible
  async waitForLocalPort() {
    if (this.checkingLocalPort) return;
    this.checkingLocalPort = true;
    
    logger.info(`🔍 Esperando que el puerto ${config.localPort} esté disponible...`);
    
    while (true) {
      if (await this.isLocalPortAvailable()) {
        this.checkingLocalPort = false;
        return true;
      }
      
      logger.info(`⏳ Reintentando en ${config.reconnectDelay / 1000} segundos...`);
      await this.sleep(config.reconnectDelay);
    }
  }

  // Crear el túnel
  async createTunnel() {
    try {
      // Verificar si el puerto local está disponible ANTES de crear el túnel
      const portAvailable = await this.isLocalPortAvailable();
      if (!portAvailable) {
        logger.warn(`❌ Puerto local ${config.localPort} no disponible. Esperando...`);
        await this.waitForLocalPort();
      }

      const options = {
        port: config.localPort,
        local_host: config.localHost
      };

      // Agregar subdominio personalizado si está configurado
      if (config.subdomain) {
        options.subdomain = config.subdomain;
      }

      logger.info(`🚀 Creando túnel para localhost:${config.localPort}...`);
      
      this.tunnel = await localtunnel(options);
      
      // Resetear contador de reintentos en conexión exitosa
      this.reconnectAttempts = 0;
      
      logger.info(`✅ Túnel creado exitosamente!`);
      logger.info(`📡 URL pública: ${this.tunnel.url}`);
      logger.info(`🔗 Puerto local: ${config.localPort} → URL remota: ${this.tunnel.url}`);
      
      // Mostrar URLs para la app Flutter
      console.log('\n' + '='.repeat(60));
      console.log('📱 CONFIGURACIÓN PARA FLUTTER:');
      console.log('='.repeat(60));
      console.log(`API_BASE_URL=${this.tunnel.url}`);
      console.log(`WS_BASE_URL=${this.tunnel.url.replace('https', 'wss')}/ws`);
      console.log('='.repeat(60) + '\n');

      // Manejar cierre del túnel
      this.tunnel.on('close', () => {
        logger.warn('⚠️ El túnel se cerró inesperadamente');
        this.handleTunnelClosure();
      });

      // Manejar errores del túnel
      this.tunnel.on('error', (error) => {
        logger.error(`❌ Error en el túnel: ${error.message}`);
        this.handleTunnelClosure();
      });

      return this.tunnel;
      
    } catch (error) {
      logger.error(`❌ Error al crear el túnel: ${error.message}`);
      await this.handleTunnelClosure();
      return null;
    }
  }

  // Manejar cierre/reconexión del túnel
  async handleTunnelClosure() {
    if (!this.isRunning) return;

    // Verificar límite de reintentos
    if (config.maxReconnectAttempts > 0 && 
        this.reconnectAttempts >= config.maxReconnectAttempts) {
      logger.error(`❌ Máximo de reintentos alcanzado (${config.maxReconnectAttempts}). Deteniendo...`);
      this.stop();
      return;
    }

    this.reconnectAttempts++;
    
    const delay = config.reconnectDelay * Math.min(this.reconnectAttempts, 5); // Backoff progresivo
    logger.info(`🔄 Reintento ${this.reconnectAttempts} en ${delay / 1000} segundos...`);
    
    await this.sleep(delay);
    
    if (this.isRunning) {
      await this.createTunnel();
    }
  }

  // Verificación periódica del puerto local
  async healthCheck() {
    while (this.isRunning) {
      await this.sleep(config.healthCheckInterval);
      
      if (!this.isRunning) break;
      
      const portAvailable = await this.isLocalPortAvailable();
      
      if (!portAvailable && this.tunnel) {
        logger.warn(`⚠️ Puerto local no disponible pero el túnel está activo. Esperando recuperación...`);
        await this.waitForLocalPort();
        
        // Después de esperar, verificar si el túnel sigue funcionando
        if (this.tunnel && this.tunnel.url) {
          logger.info(`✅ Puerto local recuperado. El túnel sigue activo en: ${this.tunnel.url}`);
        }
      }
    }
  }

  // Iniciar el servicio
  async start() {
    if (this.isRunning) {
      logger.warn('⚠️ El servicio ya está ejecutándose');
      return;
    }

    this.isRunning = true;
    logger.info('🌟 Iniciando servicio de túnel persistente...');
    
    // Iniciar el túnel
    await this.createTunnel();
    
    // Iniciar health check periódico
    this.healthCheck();
  }

  // Detener el servicio
  async stop() {
    logger.info('🛑 Deteniendo servicio...');
    this.isRunning = false;
    
    if (this.tunnel) {
      this.tunnel.close();
      this.tunnel = null;
    }
    
    logger.info('✅ Servicio detenido');
    process.exit(0);
  }

  // Helper para sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n\n⚠️ Recibida señal SIGINT');
  if (persistentTunnel) {
    await persistentTunnel.stop();
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️ Recibida señal SIGTERM');
  if (persistentTunnel) {
    await persistentTunnel.stop();
  } else {
    process.exit(0);
  }
});

// Iniciar el túnel
const persistentTunnel = new PersistentTunnel();
persistentTunnel.start().catch(error => {
  logger.error(`❌ Error fatal: ${error.message}`);
  process.exit(1);
});

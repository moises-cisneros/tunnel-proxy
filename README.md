# Tunnel Proxy - Proxy Persistente con Reconexión Automática

> Un túnel local robusto y persistente para exponer tu servidor local a internet, con reconexión automática y espera inteligente del puerto.

## 📋 Descripción

Tunnel Proxy es una herramienta diseñada para crear un túnel persistente entre tu servidor local (ej. puerto 8080) y una URL pública, similar a ngrok o localtunnel. Está especialmente pensado para desarrollo mobile con Flutter, donde necesitas probar tu API en un dispositivo físico sin acceso directo a `localhost`.

### ✨ Características

- 🔄 **Reconexión automática** - Si el túnel se cae, vuelve a conectarse automáticamente
- ⏳ **Espera inteligente** - Espera a que tu servidor local esté disponible antes de crear el túnel
- 💪 **Persistente** - Se mantiene ejecutando 24/7 con health checks periódicos
- 📱 **Optimizado para Flutter** - Genera las URLs listas para copiar en tu configuración
- 📝 **Logging completo** - Registra todos los eventos en consola y archivo
- 🔧 **Configurable** - Ajusta tiempos, reintentos y más desde variables de entorno
- 🚦 **Backoff progresivo** - Evita saturar el sistema con reintentos agresivos

## 🚀 Requisitos Previos

- **Node.js** (v18 o superior)
- **pnpm** (v9 o superior) - instalación: `npm install -g pnpm` o `corepack enable`
- Tu servidor local funcionando (ej. backend de Flutter en puerto 8080)

## 📦 Instalación

```bash
# Clonar o crear el directorio del proyecto
mkdir tunnel-proxy
cd tunnel-proxy

# Crear los archivos (package.json, index.js, config.js, .env)
# Copiar el contenido de cada archivo

# Instalar dependencias
pnpm install
```

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
# Puerto local a exponer
LOCAL_PORT=8080

# Host local (normalmente localhost)
LOCAL_HOST=localhost

# Subdominio personalizado (opcional - déjalo vacío para uno aleatorio)
SUBDOMAIN=

# Tiempo entre reintentos (milisegundos)
RECONNECT_DELAY=5000

# Máximo de reintentos (0 = infinito)
MAX_RECONNECT_ATTEMPTS=0

# Intervalo de health check (milisegundos)
HEALTH_CHECK_INTERVAL=30000

# Nivel de logging (error, warn, info, debug)
LOG_LEVEL=info
```

### Configuración Rápida

1. **Ajusta el puerto** según tu aplicación:

   ```env
   LOCAL_PORT=8080  # Cambia si usas otro puerto
   ```

2. **Subdominio personalizado** (opcional):

   ```env
   SUBDOMAIN=miapp  # Obtendrás miapp.loca.lt
   ```

## 🎮 Uso

### Comandos Básicos

```bash
# Iniciar el túnel (modo normal)
pnpm start

# Modo desarrollo con auto-reload
pnpm dev

# Detener (Ctrl+C)
```

### Ejemplos de Uso

#### 1. **Inicio Normal**

```bash
$ pnpm start

[INFO]: 🌟 Iniciando servicio de túnel persistente...
[INFO]: 🔍 Verificando puerto local 8080...
[INFO]: ✅ Puerto local 8080 está disponible
[INFO]: 🚀 Creando túnel para localhost:8080...
[INFO]: ✅ Túnel creado exitosamente!
[INFO]: 📡 URL pública: https://hip-views-heal.loca.lt

============================================================
📱 CONFIGURACIÓN PARA FLUTTER:
============================================================
API_BASE_URL=https://hip-views-heal.loca.lt
WS_BASE_URL=wss://hip-views-heal.loca.lt/ws
============================================================
```

#### 2. **Servidor Local No Disponible**

Si tu servidor aún no está corriendo:

```bash
$ pnpm start

[WARN]: ⚠️ Puerto local 8080 no está disponible (conexión rechazada)
[INFO]: 🔍 Esperando que el puerto 8080 esté disponible...
[INFO]: ⏳ Reintentando en 5 segundos...

# Cuando levantes tu servidor local...
[INFO]: ✅ Puerto local 8080 está disponible
[INFO]: 🚀 Creando túnel para localhost:8080...
[INFO]: ✅ Túnel creado exitosamente!
```

#### 3. **Ejecutar en Segundo Plano (Linux/Mac)**

```bash
# Con nohup
nohup pnpm start > tunnel.log 2>&1 &

# Ver logs
tail -f tunnel.log

# Detener proceso
ps aux | grep node
kill [PID]
```

#### 4. **Usar PM2 (Recomendado para producción)**

```bash
# Instalar PM2 globalmente
pnpm add -g pm2

# Iniciar el túnel con PM2
pm2 start index.js --name "tunnel-proxy"

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs tunnel-proxy

# Guardar configuración para reinicio automático
pm2 save
pm2 startup

# Detener
pm2 stop tunnel-proxy

# Reiniciar
pm2 restart tunnel-proxy
```

## 🔧 Solución de Problemas

### Error: `ECONNREFUSED` - Puerto local no disponible

**Problema**: El script no puede conectar con tu servidor local.

**Solución**:

```bash
# Verifica que tu servidor esté corriendo
curl http://localhost:8080

# O inicia tu servidor Flutter/backend
cd tu-proyecto-flutter
flutter run -d chrome  # o el comando que uses para el backend
```

### Error: `subdomain taken` - Subdominio en uso

**Problema**: El subdominio personalizado ya está siendo usado.

**Solución**:

```env
# En .env, cambia el SUBDOMAIN o déjalo vacío
SUBDOMAIN=miapp2  # Cambia a otro nombre
# O
SUBDOMAIN=  # Dejar vacío para uno aleatorio
```

### El túnel se cae frecuentemente

**Problema**: El túnel expira por el tiempo límite del servicio (localtunnel).

**Solución**: Aumentar la frecuencia de health checks:

```env
HEALTH_CHECK_INTERVAL=15000  # 15 segundos
```

## 📊 Monitoreo y Logs

### Ver logs en tiempo real

```bash
# Ver consola
tail -f tunnel.log

# Filtrar por nivel
grep "ERROR" tunnel.log
grep "WARN" tunnel.log
```

### Estructura de Logs

``` Bash
2024-01-15 10:30:45 [INFO]: 🌟 Iniciando servicio de túnel persistente...
2024-01-15 10:30:45 [INFO]: 🔍 Verificando puerto local 8080...
2024-01-15 10:30:45 [INFO]: ✅ Puerto local 8080 está disponible
2024-01-15 10:30:45 [INFO]: 🚀 Creando túnel para localhost:8080...
2024-01-15 10:30:46 [INFO]: ✅ Túnel creado exitosamente!
2024-01-15 10:30:46 [INFO]: 📡 URL pública: https://hip-views-heal.loca.lt
```

## 🛠️ Desarrollo y Contribución

### Modo Desarrollo

```bash
# Instalar nodemon para auto-reload
pnpm dev
```

### Scripts Disponibles

```json
{
  "start": "node index.js",      // Modo producción
  "dev": "nodemon index.js"      // Modo desarrollo con auto-reload
}
```

## 📝 Notas Importantes

1. **El túnel NO es para producción** - Está pensado solo para desarrollo y pruebas
2. **La URL cambia en cada reinicio** - A menos que uses un subdominio personalizado
3. **Requiere internet** - El túnel necesita conexión a internet activa
4. **Timeouts del servicio** - localtunnel tiene límites de tiempo, el script maneja la reconexión automática

## 🎯 Casos de Uso

- ✅ Probar APIs de Flutter en dispositivo físico iOS/Android
- ✅ Demos en vivo con clientes desde tu máquina local
- ✅ Webhooks de desarrollo (GitHub, Stripe, etc.)
- ✅ Pruebas de integración con servicios externos
- ✅ Compartir tu servidor local con el equipo temporalmente

## 🐛 Reporte de Issues

Si encuentras algún problema, verifica:

1. ✅ Node.js está actualizado (`node --version`)
2. ✅ Todas las dependencias están instaladas (`pnpm install`)
3. ✅ Tu servidor local está corriendo en el puerto correcto
4. ✅ Revisa los logs en `tunnel.log`

## 📄 Licencia

MIT - Libre para uso personal y comercial, mas detalles en [License](LICENSE).

## 👨‍💻 Desarrollo

**Developed by:** Moises Cisneros

**Contact:** <moises-cisneros@gmail.com>

**GitHub:** [https://github.com/moises-cisneros](https://github.com/moises-cisneros)

**Project Repository:** [https://github.com/moises-cisneros/tunnel-proxy](https://github.com/moises-cisneros/tunnel-proxy)

Este proyecto fue creado y es mantenido por Moises Cisneros para resolver la necesidad de una solución de túnel persistente para el desarrollo móvil con Flutter y las pruebas de API locales en dispositivos físicos.

Para preguntas, sugerencias o contribuciones, por favor, abre una incidencia en GitHub o contáctame directamente.

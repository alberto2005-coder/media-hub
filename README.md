# Media Hub 🎬🎵📻

> **Centro de entretenimiento personal, gratuito y 100% legal.**
> Películas, series, cine clásico, documentales, música en streaming, televisión en directo, radio internacional, podcasts, audiolibros y biblioteca personal local reunidos en una única interfaz moderna y rápida.

---

## 📌 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Características Principales](#-características-principales)
3. [Versiones: Escritorio vs Web](#-versiones-escritorio-vs-web)
4. [Instalación y Uso Rápido](#-instalación-y-uso-rápido)
5. [Claves de API Opcionales](#-claves-de-api-opcionales)
6. [Guía para Desarrolladores](#-guía-para-desarrolladores)
7. [Estructura del Proyecto](#-estructura-del-proyecto)
8. [Seguridad y Privacidad](#-seguridad-y-privacidad)
9. [Solución de Problemas](#-solución-de-problemas)
10. [Fuentes y Atribuciones](#-fuentes-y-atribuciones)

---

## 🌟 Visión General

**Media Hub** es una solución ligera pensada para disfrutar de contenido multimedia sin cuentas, suscripciones obligatorias ni telemetría invasiva.

Combina dos modalidades de uso:
- **Aplicación de Escritorio (Windows / Electron)**: Rendimiento nativo, lectura de carpetas locales, servidor HTTP interno para streaming local con soporte de rangos (`bytes`) y elusión segura de CORS para canales IPTV y podcasts.
- **Aplicación Web Estática (PWA / Navegador)**: Totalmente autónoma (HTML5, CSS moderno y Vanilla JavaScript), desplegable en cualquier hosting estático (GitHub Pages, Netlify, Vercel, Cloudflare Pages) o ejecutable localmente sin backend.

---

## 🚀 Características Principales

### 🎥 Películas y Series
- Catálogo sincronizado mediante la API de **The Movie Database (TMDB)**.
- Consulta de carátulas en alta resolución, sinopsis en español, puntuación, año, géneros, idioma original y tráiler oficial integrado.
- **Dónde ver legalmente**: integración con **JustWatch** para ver en qué plataformas gratuitas o de suscripción (RTVE Play, Pluto TV, Rakuten, Netflix, Prime Video, HBO Max, etc.) está disponible en España.
- Filtros por idioma, categoría y filtro exclusivo *"Solo contenido gratuito"*.

### 🏛️ Cine Clásico Libre y Documentales
- Miles de películas de dominio público, obras maestras históricas y documentales procedentes de **Internet Archive**.
- Reproducción directa dentro de la propia aplicación mediante reproductor HTML5 nativo.

### 🎵 Música en Streaming
- Reproductor de audio completo con controles de reproducción, barra de progreso, volumen, cola de reproducción y gestión de listas.
- Fuentes musicales abiertas y legales: **Audius**, **Jamendo** e **Internet Archive**.
- Compatibilidad con enlaces de **YouTube** a través de su reproductor oficial incrustado.

### 📺 Televisión en Directo (IPTV)
- Acceso a cientos de canales de emisión abierta del repositorio abierto verificado **iptv-org**.
- Reproducción HLS en tiempo real con **hls.js**.
- Sistema de failover inteligente: si un stream falla o cae, la app conmuta automáticamente a la siguiente fuente alternativa disponible del canal.
- Filtros por país, categorías (noticias, deportes, música, infantil, generalistas) y favoritos.

### 📻 Radio Mundial
- Directorio en vivo conectado a **Radio Browser** con miles de emisoras ordenadas por país, etiquetas y popularidad.

### 🎙️ Podcasts y Audiolibros
- Buscador global de podcasts mediante el directorio de **iTunes** y reproducción directa de feeds RSS.
- Audiolibros completos en español y otros idiomas cortesía de **LibriVox** y grabaciones de dominio público.

### 📂 Mi Biblioteca Local
- Selecciona cualquier carpeta de tu disco duro.
- Escaneo rápido de archivos de vídeo (`.mp4`, `.m4v`, `.webm`, `.mkv`, `.mov`, `.avi`) y audio (`.mp3`, `.m4a`, `.flac`, `.ogg`, `.opus`, `.wav`, `.aac`).
- Streaming local protegido mediante token aleatorio generado en memoria, con soporte completo de seek (adelantar y retroceder fluidamente).
- Botón de apertura externa (↗) para reproducir cualquier archivo con tu reproductor del sistema (por ejemplo, VLC o MPC-HC).

---

## 💻 Versiones: Escritorio vs Web

| Característica | Escritorio (`.exe`) | Web Estática (`web/`) |
|---|:---:|:---:|
| **Instalación** | No requiere (Portable) | En navegador o PWA |
| **TV en Directo (HLS sin bloqueos CORS)** | ✅ Completo | ⚠️ Limitado por cabeceras CORS del emisor |
| **Biblioteca Local (Carpetas del PC)** | ✅ Sí | ❌ No accesible por sandbox de navegador |
| **Carga de claves vía `.env` local** | ✅ Sí | ⚠️ Solo vía menú Ajustes (`localStorage`) |
| **Apertura de archivos en VLC/Sistema** | ✅ Sí | ❌ No soportado en navegadores web |
| **Podcasts con cualquier feed RSS** | ✅ Sí | ⚠️ Solo feeds con cabeceras CORS abiertas |

---

## 📦 Instalación y Uso Rápido

### Opción 1: Ejecutable Portable para Windows (.exe)
1. Descarga o abre el archivo en la carpeta `release/`:
   ```
   MediaHub-1.0.0-portable.exe
   ```
2. Haz doble clic sobre el ejecutable. No requiere instalador ni permisos de administrador.
3. *(Opcional)*: Crea un archivo `.env` en la misma carpeta del `.exe` con tus claves gratuitas (ver sección siguiente).

> **Aviso de Windows SmartScreen**: Al ser un binario de código abierto sin certificado comercial de pago de Microsoft, Windows puede mostrar la ventana informativa de SmartScreen. Haz clic en **«Más información»** y luego en **«Ejecutar de todas formas»**.

### Opción 2: Versión Web Estática
Puedes servir la carpeta `web/` con cualquier servidor HTTP local:
```bash
# Con Node.js:
npx serve web -l 8080

# Con Python (si está disponible):
python -m http.server 8080 --directory web
```
Abre tu navegador en `http://localhost:8080`.

---

## 🔑 Claves de API Opcionales

La aplicación es **100% funcional sin ninguna clave de API**: Internet Archive, TV en directo, Radio, Audius, Podcasts, Audiolibros y Biblioteca local funcionan desde el primer momento.

Para enriquecer el catálogo de películas/series y música indie, puedes añadir claves gratuitas:

| Servicio | Variable | Utilidad | Registro gratuito |
|---|---|---|---|
| **TMDB** | `TMDB_API_KEY` | Fichas de películas/series y plataformas JustWatch | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |
| **Jamendo** | `JAMENDO_CLIENT_ID` | Búsqueda y streaming en catálogo Jamendo | [devportal.jamendo.com](https://devportal.jamendo.com) |

### Cómo configurarlas:
- **En la app de Escritorio**: Copia el archivo `.env.example` como `.env` junto al ejecutable y añade tus claves. También puedes usar el botón *"Crear .env de ejemplo"* dentro de la pantalla **Ajustes** de la app.
- **En la versión Web**: Dirígete a **Ajustes** dentro de la interfaz web e introdúcelas en los campos correspondientes (se almacenan únicamente en el `localStorage` de tu propio navegador).

---

## 🛠️ Guía para Desarrolladores

### Requisitos previos
- **Node.js**: versión 20.x o superior.
- **npm**: gestor de paquetes estándar de Node.

### Pasos de compilación

1. **Clonar o descargar el proyecto**:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd media-hub
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo (Electron)**:
   ```bash
   npm start
   ```

4. **Probar la versión web estática**:
   ```bash
   npm run web
   ```

5. **Compilar ejecutable de Windows con icono personalizado**:
   ```bash
   # Generar versión portable autoejecutable (.exe con icono):
   npm run dist:win

   # Generar versión descomprimida directa (dist/win-unpacked):
   npm run dist:win-dir
   ```
   El binario resultante se generará en la carpeta `dist/`.

---

## 📁 Estructura del Proyecto

```
media-hub/
├── build/                      # Recursos de compilación y empaquetado
│   └── icon.ico                # Icono multi-resolución de Windows (16 a 256px)
├── electron/                   # Backend de escritorio con Electron
│   ├── main.js                 # Proceso principal: servidor local, IPC, streaming y CORS
│   └── preload.js              # Puente de contexto seguro (ContextBridge)
├── web/                        # Frontend de la aplicación (Web Estática y PWA)
│   ├── icons/                  # Iconos PWA y web (SVG, PNG, ICO)
│   ├── vendor/                 # Librerías cliente (hls.min.js)
│   ├── index.html              # Estructura principal y diálogos de interfaz
│   ├── styles.css              # Diseño responsive, temas claro/oscuro y componentes
│   ├── app.js                  # Lógica del cliente, reproductores, APIs y estado
│   ├── manifest.webmanifest    # Manifiesto de aplicación web progresiva (PWA)
│   └── sw.js                   # Service Worker para funcionamiento offline
├── release/                    # Carpeta para binarios compilados listos para distribución
├── .env.example                # Plantilla de variables de entorno
├── .gitignore                  # Exclusiones de Git (node_modules, dist, .env)
└── package.json                # Metadatos del proyecto, scripts y configuración de electron-builder
```

---

## 🔒 Seguridad y Privacidad

- **Sin analíticas ni rastreo**: No existe telemetría ni envío de datos a servidores externos. Favoritos, historial, listas y claves residen exclusivamente en local.
- **Servidor local restringido**: El servidor interno de Electron solo escucha en `127.0.0.1` en un puerto dinámico y requiere un token criptográfico generado aleatoriamente en cada inicio para acceder a archivos locales.
- **Aislamiento de contexto**: `nodeIntegration: false`, `contextIsolation: true` y `sandbox: true` activos en las ventanas de Electron.
- **Protección de ejecución**: El puente IPC solo permite solicitar la apertura de extensiones de medios explícitamente autorizadas; nunca permite ejecutar archivos de sistema o scripts externos.

---

## ❓ Solución de Problemas

- **«Falta la clave de TMDB»**: El catálogo de novedades y fichas cinematográficas requiere la clave gratuita. Regístrate en TMDB, obtén tu clave y colócala en el archivo `.env` o en la sección Ajustes.
- **Un canal de TV no carga**: Las transmisiones IPTV en abierto pueden saturarse o quedar inactivas por las emisoras. Media Hub intenta automáticamente otras fuentes; si ninguna responde, el canal no está transmitiendo en ese momento.
- **Un vídeo local no se visualiza en la ventana integrada**: Formatos como MKV con códecs específicos (HEVC/H.265, DTS) pueden no ser compatibles con el decodificador nativo de Chromium. Utiliza el botón **↗** situado junto al archivo para reproducirlo al instante en VLC u otro reproductor de tu elección.

---

## 📜 Fuentes y Atribuciones

- **The Movie Database (TMDB)**: Datos descriptivos y carátulas de películas y series. *Este producto utiliza la API de TMDB pero no está avalado ni certificado por TMDB.*
- **JustWatch**: Información de disponibilidad y servicios de streaming en España.
- **iptv-org**: Listado comunitario de canales de televisión públicos y gratuitos.
- **Internet Archive**: Archivo histórico de películas, documentales y audio de dominio público.
- **Radio Browser**: Directorio libre de estaciones de radio por Internet.
- **Audius** & **Jamendo**: Plataformas de música libre e independiente con licencias Creative Commons.
- **LibriVox**: Catálogo de audiolibros libres grabados por voluntarios.
- **hls.js**: Motor de reproducción HLS para JavaScript (Licencia Apache-2.0).

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE). Puedes usarlo, modificarlo y distribuirlo libremente.

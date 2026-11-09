# MediaHub

[Español](#español) | [English](#english)

---

<a name="español"></a>
## Español

### Índice
- [MediaHub](#mediahub)
  - [Español](#español)
    - [Índice](#índice)
    - [1. Descripción General](#1-descripción-general)
    - [2. Características Principales](#2-características-principales)
    - [3. Flujo de la Aplicación](#3-flujo-de-la-aplicación)
    - [4. Estructura del Proyecto](#4-estructura-del-proyecto)
    - [5. Versiones: Escritorio vs Web](#5-versiones-escritorio-vs-web)
    - [6. Instalación y Uso](#6-instalación-y-uso)
      - [Aplicación de Escritorio (Windows)](#aplicación-de-escritorio-windows)
      - [Versión Web](#versión-web)
    - [7. Claves de API Opcionales](#7-claves-de-api-opcionales)
    - [8. Desarrollo y Compilación](#8-desarrollo-y-compilación)
      - [Requisitos](#requisitos)
      - [Pasos de desarrollo](#pasos-de-desarrollo)
    - [9. Seguridad y Privacidad](#9-seguridad-y-privacidad)
    - [10. Atribuciones](#10-atribuciones)
  - [English](#english)
    - [Table of Contents](#table-of-contents)
    - [1. Overview](#1-overview)
    - [2. Key Features](#2-key-features)
    - [3. Application Architecture](#3-application-architecture)
    - [4. Project Structure](#4-project-structure)
    - [5. Desktop vs Web Version](#5-desktop-vs-web-version)
    - [6. Installation and Usage](#6-installation-and-usage)
      - [Desktop Version (Windows)](#desktop-version-windows)
      - [Web Version](#web-version)
    - [7. Optional API Keys](#7-optional-api-keys)
    - [8. Development and Build](#8-development-and-build)
      - [Prerequisites](#prerequisites)
      - [Commands](#commands)
    - [9. Security and Privacy](#9-security-and-privacy)
    - [10. Attributions](#10-attributions)

---

### 1. Descripción General

MediaHub es un centro multimedia de escritorio y entorno web diseñado para centralizar películas, series, documentales, cine clásico, música en streaming, televisión en directo, radio internacional, podcasts, audiolibros y archivos locales en una única interfaz unificada.

Está concebido bajo principios de privacidad, rapidez y legalidad, sin incluir telemetría, rastreadores ni dependencias de servidores propietarios externos.

---

### 2. Características Principales

* Películas y Series: Catálogo alimentado mediante la API de The Movie Database (TMDB) con integración de disponibilidad en plataformas legales en España a través de JustWatch.
* Cine Clásico y Documentales: Acceso directo a obras de dominio público y licencias abiertas alojadas en Internet Archive.
* Música en Streaming: Integración con catálogos libres de Audius, Jamendo e Internet Archive, junto a soporte de enlaces de YouTube mediante su reproductor oficial.
* TV en Directo: Canales de emisión pública internacional provenientes del catálogo iptv-org con reproductor HLS nativo y soporte de fallback automático entre fuentes.
* Radio Internacional: Directorio global conectado a la API de Radio Browser.
* Podcasts y Audiolibros: Buscador e interfaz de reproducción para episodios RSS (vía iTunes) y audiolibros de dominio público (LibriVox).
* Biblioteca Local: Escaneo y reproducción de archivos de audio y vídeo de tu propio equipo con soporte de streaming local dinamizado con tokens en memoria y compatibilidad para abrir archivos en reproductores del sistema.

---

### 3. Flujo de la Aplicación

```
+-----------------------------------------------------------------------+
|                              MediaHub                                 |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
+------------------+                               +------------------+
| Proceso Electron |                               |  Interfaz Web    |
|   (main.js)      |                               |    (app.js)      |
+------------------+                               +------------------+
         |                                                   |
         +---> Servidor Local HTTP (127.0.0.1:PUERTO) <------+
         |     - Streaming seguro de archivos con Token      |
         |     - Gestión de rangos (bytes) para Seek        |
         |                                                   |
         +---> Servicios Externos APIs                       |
               - TMDB / JustWatch / Internet Archive         |
               - Audius / Jamendo / Radio Browser / IPTV-org  |
```

---

### 4. Estructura del Proyecto

```
media-hub/
├── build/                      # Recursos de empaquetado e iconos
│   └── icon.ico                # Icono de aplicación para Windows
├── electron/                   # Código del backend de escritorio
│   ├── main.js                 # Proceso principal, servidor local HTTP e IPC
│   └── preload.js              # Puente seguro de contexto (contextBridge)
├── web/                        # Interfaz gráfica estática (PWA / Web)
│   ├── icons/                  # Iconografía y recursos gráficos
│   ├── vendor/                 # Librerías cliente (hls.min.js)
│   ├── app.js                  # Lógica del cliente, estado y reproductores
│   ├── index.html              # Estructura principal y contenedores
│   ├── manifest.webmanifest    # Configuración PWA
│   ├── styles.css              # Hoja de estilos principal
│   └── sw.js                   # Service Worker para ejecución web
├── .env.example                # Plantilla para claves de API opcionales
├── package.json                # Configuración de dependencias y electron-builder
└── README.md                   # Documentación principal del proyecto
```

---

### 5. Versiones: Escritorio vs Web

| Función | Aplicación Escritorio | Versión Web Estática |
|---|---|---|
| Instalación | Portable (sin instalación) | Navegador web / PWA |
| TV en Directo (HLS) | Sin restricciones CORS | Sujeto a políticas CORS de emisores |
| Escaneo de Biblioteca Local | Soportado mediante Node.js | No disponible por aislamiento del navegador |
| Carga de claves `.env` | Soportado en carpeta local | Almacenamiento en `localStorage` |
| Reproducción con app del sistema | Soportado (VLC, etc.) | No disponible |

---

### 6. Instalación y Uso

#### Aplicación de Escritorio (Windows)
1. Descarga el ejecutable `MediaHub-1.0.0-portable.exe` desde la sección de lanzamientos.
2. Ejecuta el archivo de forma directa. No requiere permisos de administración ni instalación.

#### Versión Web
Puedes servir la carpeta `web/` con cualquier servidor de archivos estáticos:
```bash
npx serve web -l 8080
```
Navega a `http://localhost:8080` desde tu explorador.

---

### 7. Claves de API Opcionales

El sistema es plenamente funcional sin ninguna clave. Sin embargo, para enriquecer las fichas cinematográficas o el catálogo musical de Jamendo se pueden configurar las siguientes variables:

* `TMDB_API_KEY`: Clave de API de The Movie Database.
* `JAMENDO_CLIENT_ID`: Identificador de cliente para Jamendo API.

En la aplicación de escritorio se pueden guardar en un archivo `.env` ubicado en el directorio del programa. En la versión web se pueden ingresar dentro del menú de Ajustes.

---

### 8. Desarrollo y Compilación

#### Requisitos
* Node.js v20.0.0 o superior
* npm

#### Pasos de desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo con Electron
npm start

# Generar el ejecutable ejecutable portátil para Windows
npm run build
```

---

### 9. Seguridad y Privacidad

* Aislamiento de Procesos: Electron ejecuta `contextIsolation: true`, `nodeIntegration: false` y `sandbox: true`.
* Servidor HTTP Dinámico: Escucha únicamente en la interfaz de bucle de retorno `127.0.0.1` mediante un puerto aleatorio y valida cada petición con un token criptográfico generado por sesión.
* Sin Telemetría: La aplicación no recopila ni transmite estadísticas de uso a ningún servidor.

---

### 10. Atribuciones

* The Movie Database (TMDB) por la información cinematográfica.
* JustWatch por los datos de disponibilidad de plataformas en España.
* iptv-org por el catálogo abierto de emisiones públicas.
* Radio Browser por el directorio global de radio.
* Internet Archive, Audius, Jamendo y LibriVox por las fuentes de contenido libre.

---

<a name="english"></a>
## English

### Table of Contents
1. [Overview](#1-overview)
2. [Key Features](#2-key-features)
3. [Application Architecture](#3-application-architecture)
4. [Project Structure](#4-project-structure)
5. [Desktop vs Web Version](#5-desktop-vs-web-version)
6. [Installation and Usage](#6-installation-and-usage)
7. [Optional API Keys](#7-optional-api-keys)
8. [Development and Build](#8-development-and-build)
9. [Security and Privacy](#9-security-and-privacy)
10. [Attributions](#10-attributions)

---

### 1. Overview

MediaHub is a lightweight desktop application and web client built to aggregate movies, TV shows, documentaries, classic films, streaming music, live TV, international radio, podcasts, audiobooks, and local media into a unified, responsive interface.

It is designed with privacy, performance, and compliance in mind, operating without telemetry, trackers, or centralized tracking servers.

---

### 2. Key Features

* Movies and TV Shows: Metadata fetched via The Movie Database (TMDB) API, paired with streaming availability in Spain via JustWatch integration.
* Classic Cinema and Documentaries: Direct access to public domain films and open-licensed documentaries hosted on the Internet Archive.
* Music Streaming: Native playback integration with Audius, Jamendo, Internet Archive, and embedded YouTube links.
* Live TV: Access to public broadcast channels from the open iptv-org repository using native HLS playback and automated stream failover.
* International Radio: Global directory access powered by the Radio Browser API.
* Podcasts and Audiobooks: Search and playback capabilities for RSS feeds (via iTunes) and public domain audiobooks (LibriVox).
* Local Media Library: Local folder scanning for audio and video files utilizing a secure local HTTP streaming server with seek support.

---

### 3. Application Architecture

```
+-----------------------------------------------------------------------+
|                              MediaHub                                 |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
+------------------+                               +------------------+
| Electron Process |                               |    Web Client    |
|   (main.js)      |                               |    (app.js)      |
+------------------+                               +------------------+
         |                                                   |
         +---> Local HTTP Server (127.0.0.1:PORT) <----------+
         |     - Token-authenticated Local Streaming         |
         |     - HTTP Range (bytes) support for Seek         |
         |                                                   |
         +---> External API Providers                        |
               - TMDB / JustWatch / Internet Archive         |
               - Audius / Jamendo / Radio Browser / IPTV-org  |
```

---

### 4. Project Structure

```
media-hub/
├── build/                      # Packaging resources and icon assets
│   └── icon.ico                # Windows application icon
├── electron/                   # Desktop backend code
│   ├── main.js                 # Main process, local HTTP server, IPC
│   └── preload.js              # Secure context bridge script
├── web/                        # Frontend web assets (PWA / Web)
│   ├── icons/                  # Web icons and manifests
│   ├── vendor/                 # Client libraries (hls.min.js)
│   ├── app.js                  # Frontend logic, state, and players
│   ├── index.html              # HTML markup
│   ├── manifest.webmanifest    # PWA configuration
│   ├── styles.css              # Main application stylesheet
│   └── sw.js                   # Service Worker implementation
├── .env.example                # Template for optional API credentials
├── package.json                # Project configuration and build scripts
└── README.md                   # Main documentation file
```

---

### 5. Desktop vs Web Version

| Feature | Desktop App | Static Web Version |
|---|---|---|
| Installation | Portable executable | Web Browser / PWA |
| Live TV (HLS) | Fully supported | Subject to provider CORS policies |
| Local Library Scanning | Supported | Not available due to browser sandbox |
| `.env` File Support | Supported | Stored in `localStorage` |
| System Player Integration | Supported (VLC, etc.) | Not available |

---

### 6. Installation and Usage

#### Desktop Version (Windows)
1. Download `MediaHub-1.0.0-portable.exe` from the GitHub Releases section.
2. Run the executable directly. No administrative privileges or installation steps are required.

#### Web Version
Serve the contents of the `web/` directory using any static file server:
```bash
npx serve web -l 8080
```
Open your browser and navigate to `http://localhost:8080`.

---

### 7. Optional API Keys

The application functions completely out-of-the-box without API keys. However, optional services can be enabled with the following keys:

* `TMDB_API_KEY`: The Movie Database API key for expanded metadata.
* `JAMENDO_CLIENT_ID`: Jamendo API Client ID for indie music searching.

For the desktop app, keys can be placed in a `.env` file alongside the executable. For the web version, enter them via the Settings screen.

---

### 8. Development and Build

#### Prerequisites
* Node.js v20.0.0 or higher
* npm

#### Commands
```bash
# Install dependencies
npm install

# Run application in development mode
npm start

# Build portable Windows executable
npm run build
```

---

### 9. Security and Privacy

* Process Isolation: Electron processes operate with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
* Local Server Security: The internal HTTP server binds strictly to `127.0.0.1` on a dynamic port and requires per-session cryptographic token authorization.
* Zero Telemetry: No usage analytics or telemetry data are collected or transmitted.

---

### 10. Attributions

* The Movie Database (TMDB) for movie and TV metadata.
* JustWatch for streaming availability data.
* iptv-org for public channel listings.
* Radio Browser for global radio streams.
* Internet Archive, Audius, Jamendo, and LibriVox for open media content.
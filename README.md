# MediaHub

[![Electron](https://img.shields.io/badge/Electron-45-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PWA](https://img.shields.io/badge/PWA-instalable-5A0FC8)](https://web.dev/progressive-web-apps/)
[![MIT](https://img.shields.io/badge/Licencia-MIT-green)](LICENSE)

[Español](#español) · [English](#english)

---

## Español

### Índice

- [Descripción](#descripción)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Escritorio frente a web](#escritorio-frente-a-web)
- [Instalación y uso](#instalación-y-uso)
- [Claves de API opcionales](#claves-de-api-opcionales)
- [Desarrollo y compilación](#desarrollo-y-compilación)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Atribuciones](#atribuciones)
- [Licencia](#licencia)

### Descripción

**MediaHub** reúne películas, series, documentales, cine clásico, música, televisión en directo, radio internacional, podcasts, audiolibros y archivos locales en una sola interfaz. Funciona como **aplicación de escritorio Electron** y como **PWA estática** en el navegador.

El proyecto evita telemetría y rastreadores, y se apoya en catálogos abiertos o en las APIs oficiales de cada servicio.

### Características

- **Películas y series** con metadatos de **TMDB** y disponibilidad legal en España vía **JustWatch**.
- **Cine clásico y documentales** de dominio público alojados en **Internet Archive**.
- **Música en streaming** desde **Audius**, **Jamendo** e **Internet Archive**, más enlaces de YouTube con su reproductor oficial.
- **TV en directo** con canales públicos del catálogo **iptv-org**, reproductor **HLS** nativo y conmutación automática entre fuentes.
- **Radio internacional** con el directorio de **Radio Browser**.
- **Podcasts** por RSS (vía iTunes) y **audiolibros** de dominio público de **LibriVox**.
- **Biblioteca local**: escaneo y reproducción de audio y vídeo del equipo, con servidor HTTP local para *seek* y opción de abrir en el reproductor del sistema.
- **PWA instalable** y diseño responsive.

### Arquitectura

```text
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
         +---> Servidor HTTP local (127.0.0.1:PUERTO) <------+
         |     - Streaming de archivos con token por sesión
         |     - Rangos de bytes para seek
         |                                                   |
         +---> APIs externas
               - TMDB / JustWatch / Internet Archive
               - Audius / Jamendo / Radio Browser / iptv-org
```

En escritorio, el proceso principal de Electron levanta un servidor HTTP en `127.0.0.1` con un puerto aleatorio y un token criptográfico por sesión; la interfaz consume ese servidor a través de `preload.js` con aislamiento de contexto.

### Estructura del proyecto

```text
media-hub/
├── build/icon.ico              # Icono de Windows
├── electron/
│   ├── main.js                 # Proceso principal, servidor HTTP e IPC
│   └── preload.js              # Puente seguro (contextBridge)
├── web/                        # Interfaz estática / PWA
│   ├── icons/
│   ├── vendor/hls.min.js
│   ├── app.js                  # Estado, reproductores y vistas
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── styles.css
│   └── sw.js                   # Service Worker
├── .env.example                # Plantilla de claves opcionales
├── setup-script.iss            # Instalador con Inno Setup
├── package.json                # Dependencias y electron-builder
├── LICENSE
└── README.md
```

### Escritorio frente a web

| Función | Aplicación de escritorio | Versión web estática |
|---|---|---|
| Instalación | Ejecutable portable | Navegador / PWA |
| TV en directo (HLS) | Sin restricciones CORS | Sujeta a las políticas CORS del emisor |
| Biblioteca local | Sí, mediante Node.js | No, por el aislamiento del navegador |
| Claves de API | Archivo `.env` junto al ejecutable | `localStorage` |
| Reproductor del sistema | Sí (VLC y otros) | No disponible |

### Instalación y uso

**Escritorio (Windows)**

1. Descarga `MediaHub-1.0.0-portable.exe` desde [Releases](https://github.com/alberto2005-coder/media-hub/releases).
2. Ejecútalo directamente: no requiere instalación ni permisos de administrador.

El repositorio incluye `MediaHub-1.0.0-portable.exe.sha256.txt` para comprobar la integridad de la descarga:

```powershell
Get-FileHash .\MediaHub-1.0.0-portable.exe -Algorithm SHA256
```

**Versión web**

```bash
npx serve web -l 8080
```

Abre <http://localhost:8080>. También puedes publicar `web/` en cualquier hosting estático.

### Claves de API opcionales

La aplicación funciona sin ninguna clave. Para ampliar metadatos o el catálogo musical:

| Variable | Servicio |
|---|---|
| `TMDB_API_KEY` | The Movie Database |
| `JAMENDO_CLIENT_ID` | Jamendo |

En escritorio se leen de un archivo `.env` copiado de `.env.example` y colocado junto al programa; en la versión web se introducen en **Ajustes** y se guardan en `localStorage`.

### Desarrollo y compilación

Requisitos: **Node.js 20 o superior** y npm.

```bash
npm install
npm start        # Electron en modo desarrollo
npm run build    # electron-builder --dir → release/
npm run release  # compila y publica el portable
```

- `npm run build` genera la aplicación desempaquetada en `release/` (no un instalador).
- `setup-script.iss` es el script de **Inno Setup** para construir el instalador tradicional.
- El portable se nombra `MediaHub-<versión>-portable.exe` según la configuración de `package.json`.

### Seguridad y privacidad

- **Aislamiento de procesos**: `contextIsolation: true`, `nodeIntegration: false` y `sandbox: true`.
- **Servidor local**: escucha solo en `127.0.0.1`, usa un puerto aleatorio y exige un token por sesión.
- **Sin telemetría**: no se envían estadísticas de uso a ningún servidor.
- **Contenido de terceros**: MediaHub enlaza catálogos públicos y APIs oficiales; no aloja ni distribuye medios. Comprueba que el uso de cada fuente respeta sus términos y la legislación de tu país.

### Atribuciones

- **TMDB** — metadatos de cine y televisión.
- **JustWatch** — disponibilidad en plataformas.
- **iptv-org** — listado abierto de canales públicos.
- **Radio Browser** — directorio global de radio.
- **Internet Archive**, **Audius**, **Jamendo** y **LibriVox** — contenido libre.

### Licencia

**MIT** — consulta [LICENSE](LICENSE).

---

## English

### Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Desktop vs web](#desktop-vs-web)
- [Installation and usage](#installation-and-usage)
- [Optional API keys](#optional-api-keys)
- [Development and build](#development-and-build)
- [Security and privacy](#security-and-privacy)
- [Attributions](#attributions)
- [License](#license)

### Overview

**MediaHub** brings movies, TV shows, documentaries, classic cinema, music, live TV, international radio, podcasts, audiobooks and local files into a single interface. It runs as an **Electron desktop app** and as a **static PWA** in the browser.

The project avoids telemetry and trackers, relying on open catalogues or each service's official APIs.

### Features

- **Movies and TV shows** with **TMDB** metadata and legal availability in Spain via **JustWatch**.
- **Classic cinema and documentaries** from the public domain, hosted on **Internet Archive**.
- **Music streaming** from **Audius**, **Jamendo** and **Internet Archive**, plus YouTube links through its official player.
- **Live TV** with public channels from **iptv-org**, a native **HLS** player and automatic stream failover.
- **International radio** via the **Radio Browser** directory.
- **Podcasts** over RSS (through iTunes) and public-domain **audiobooks** from **LibriVox**.
- **Local library**: scans and plays audio and video from your machine, with a local HTTP server for seeking and an option to open files in the system player.
- **Installable PWA** with a responsive layout.

### Architecture

```text
+-----------------------------------------------------------------------+
|                              MediaHub                                 |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
+------------------+                               +------------------+
| Electron process |                               |    Web client    |
|   (main.js)      |                               |    (app.js)      |
+------------------+                               +------------------+
         |                                                   |
         +---> Local HTTP server (127.0.0.1:PORT) <----------+
         |     - Token-authenticated local streaming
         |     - Byte-range support for seeking
         |                                                   |
         +---> External APIs
               - TMDB / JustWatch / Internet Archive
               - Audius / Jamendo / Radio Browser / iptv-org
```

On desktop, Electron's main process starts an HTTP server on `127.0.0.1` with a random port and a per-session cryptographic token; the UI consumes it through `preload.js` with context isolation.

### Project structure

```text
media-hub/
├── build/icon.ico              # Windows icon
├── electron/
│   ├── main.js                 # Main process, HTTP server and IPC
│   └── preload.js              # Secure contextBridge
├── web/                        # Static UI / PWA
│   ├── icons/
│   ├── vendor/hls.min.js
│   ├── app.js                  # State, players and views
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── styles.css
│   └── sw.js                   # Service Worker
├── .env.example                # Template for optional keys
├── setup-script.iss            # Inno Setup installer
├── package.json                # Dependencies and electron-builder
├── LICENSE
└── README.md
```

### Desktop vs web

| Feature | Desktop app | Static web version |
|---|---|---|
| Installation | Portable executable | Browser / PWA |
| Live TV (HLS) | No CORS restrictions | Subject to the broadcaster's CORS policy |
| Local library | Yes, through Node.js | Not available, due to browser sandboxing |
| API keys | `.env` file next to the executable | `localStorage` |
| System player | Yes (VLC and others) | Not available |

### Installation and usage

**Desktop (Windows)**

1. Download `MediaHub-1.0.0-portable.exe` from [Releases](https://github.com/alberto2005-coder/media-hub/releases).
2. Run it directly: no installation or administrator rights required.

The repository ships `MediaHub-1.0.0-portable.exe.sha256.txt` to verify the download:

```powershell
Get-FileHash .\MediaHub-1.0.0-portable.exe -Algorithm SHA256
```

**Web version**

```bash
npx serve web -l 8080
```

Open <http://localhost:8080>. You can also deploy `web/` to any static host.

### Optional API keys

The app works without any key. To extend metadata or the music catalogue:

| Variable | Service |
|---|---|
| `TMDB_API_KEY` | The Movie Database |
| `JAMENDO_CLIENT_ID` | Jamendo |

On desktop they are read from a `.env` file copied from `.env.example` and placed next to the program; in the web version you enter them in **Settings** and they are stored in `localStorage`.

### Development and build

Requirements: **Node.js 20 or later** and npm.

```bash
npm install
npm start        # Electron in development mode
npm run build    # electron-builder --dir → release/
npm run release  # build and publish the portable
```

- `npm run build` produces an unpacked app in `release/`, not an installer.
- `setup-script.iss` is the **Inno Setup** script for the traditional installer.
- The portable is named `MediaHub-<version>-portable.exe` per `package.json`.

### Security and privacy

- **Process isolation**: `contextIsolation: true`, `nodeIntegration: false` and `sandbox: true`.
- **Local server**: binds only to `127.0.0.1`, uses a random port and requires a per-session token.
- **No telemetry**: no usage statistics are sent to any server.
- **Third-party content**: MediaHub links to public catalogues and official APIs; it does not host or distribute media. Make sure your use of each source complies with its terms and your local law.

### Attributions

- **TMDB** — film and TV metadata.
- **JustWatch** — platform availability.
- **iptv-org** — open public channel listings.
- **Radio Browser** — global radio directory.
- **Internet Archive**, **Audius**, **Jamendo** and **LibriVox** — open content.

### License

**MIT** — see [LICENSE](LICENSE).

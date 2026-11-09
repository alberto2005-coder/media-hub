# Media Hub

Centro de entretenimiento personal, **gratuito y legal**: películas, series, documentales, música, radio, podcasts y audiolibros en una sola interfaz moderna. Se entrega de dos formas:

| Versión | Qué es | Cómo se usa |
|---|---|---|
| **Escritorio (.exe)** | `MediaHub-1.0.0-portable.exe` para Windows, sin instalación | Doble clic |
| **Web estática** | Carpeta `web/`: HTML + CSS + JS, sin servidor ni base de datos | Súbela a cualquier hosting estático o ábrela en local |

La versión de escritorio añade lo que el navegador no permite (por ejemplo, que casi todos los canales de TV funcionen sin bloqueos CORS): biblioteca local con adelantar/retroceder, podcasts con cualquier feed, lectura del `.env` y apertura con el reproductor del sistema.

---

## 1. Qué incluye

- **Películas y series** (TMDB): carátulas, sinopsis, géneros, idioma original y **dónde verlas legalmente en España** (RTVE Play, Pluto TV, Rakuten, Plex, Netflix…). Filtro «solo gratis», por idioma y por género; búsqueda; tráiler.
- **Cine clásico libre** y **documentales** (Internet Archive): se reproducen dentro de la app.
- **Música** estilo Spotify: Audius, Jamendo, Internet Archive y enlaces de YouTube (reproductor oficial). Búsqueda, cola, listas propias.
- **TV en directo**: todos los canales activos del catálogo abierto **iptv-org** (nacionales e internacionales), filtrables por país y categoría, con búsqueda y favoritos. Reproducción HLS con hls.js y cambio automático a otra emisión del canal si falla.
- **Radio** en directo (Radio Browser), **podcasts** (directorio de iTunes + feeds RSS) y **audiolibros** (LibriVox).
- **Mi biblioteca**: tus propios archivos de vídeo y audio; nunca salen de tu equipo.
- **Plataformas**: accesos a RTVE Play, Atresplayer, Mediaset Infinity, 3Cat, Pluto TV, Rakuten TV, Plex, Arte.tv, YouTube… con filtros por tipo e idioma.
- Favoritos, listas, recientes y ajustes. Tema oscuro/claro automático. Funciona en móvil.

## 2. Claves gratuitas (opcionales)

Sin ninguna clave la app ya funciona con Internet Archive, Audius, radio, podcasts, YouTube por enlace y tu biblioteca. Con las claves se activan:

| Clave | Para qué | Dónde se consigue |
|---|---|---|
| `TMDB_API_KEY` | Catálogo de películas y series y disponibilidad | https://www.themoviedb.org/settings/api |
| `JAMENDO_CLIENT_ID` | Música libre de Jamendo | https://devportal.jamendo.com |

> TMDB ofrece su API sin coste para uso personal/no comercial y exige atribución (la app la incluye). Comprueba las condiciones vigentes en su web al crear la clave.

### Dónde ponerlas

- **.exe**: copia `.env.example` como `.env` **junto al .exe** y rellénalo. También sirve la pantalla **Ajustes → Crear .env de ejemplo**, que lo crea y abre su carpeta. Reinicia la app después de editarlo.
- **Web estática**: pantalla **Ajustes**; se guardan solo en tu navegador (`localStorage`). **No pongas claves en el código de una web pública**: cualquiera podría verlas. Cada visitante usa las suyas.

El archivo `.env` está en `.gitignore`: no lo subas a repositorios.

## 3. Usar el .exe

1. Descomprime y haz doble clic en `MediaHub-1.0.0-portable.exe`.
2. Windows SmartScreen puede avisar porque el programa no está firmado: «Más información → Ejecutar de todas formas».
3. En **Mi biblioteca** elige tu carpeta de contenido. Se recuerda para la próxima vez.

Notas:
- Los vídeos MKV, HEVC (H.265) o AVI pueden no reproducirse dentro de la app. El botón **↗** de cada fila los abre con tu reproductor del sistema (por ejemplo VLC).
- La app abre un servidor **solo en 127.0.0.1** (tu propio equipo) con un token aleatorio por sesión. Solo sirve archivos multimedia de las carpetas que tú eliges.

## 4. Publicar la web estática

La carpeta `web/` es todo lo necesario. Opciones gratuitas: GitHub Pages, Netlify, Cloudflare Pages, Vercel, o cualquier hosting con HTTPS.

Prueba local rápida (necesita Node.js):

```bash
npm run web      # sirve web/ en http://localhost:8080
```

Limitaciones de la versión web:
- Muchos canales de TV y algunos feeds de podcast no permiten reproducirse/leerse desde un navegador (CORS); en la app de escritorio funcionan casi todos.
- Si la web va por HTTPS, se ocultan los canales y radios que solo emiten por HTTP.
- Algunas radios solo emiten por HTTP y se ocultan cuando la web va por HTTPS.
- Los reproductores incrustados de YouTube necesitan servir la web por http(s); si abres `index.html` con doble clic (file://), el tráiler y los enlaces de YouTube pueden no cargar.
- Se puede instalar como app (PWA) desde Chrome/Edge cuando está alojada en HTTPS.

## 5. Compilar tú mismo

Necesitas Node.js 20+.

```bash
npm install
npm start               # abrir la app de escritorio en desarrollo
npm run dist:win        # genera dist/MediaHub-1.0.0-portable.exe
```

Con GitHub: el flujo `.github/workflows/build.yml` compila el .exe en Windows y publica la web en GitHub Pages en cada push a `main`.

## 6. Estructura

```
media-hub-app/
├── web/                 Interfaz (HTML/CSS/JS) = la web estática
│   ├── index.html  styles.css  app.js  sw.js  manifest.webmanifest  icons/
├── electron/            Envoltorio de escritorio
│   ├── main.js          Servidor local, .env, diálogos, apertura de archivos
│   └── preload.js       Puente seguro entre la app y el sistema
├── .env.example         Plantilla de claves
├── package.json         Scripts y configuración del empaquetado
└── .github/workflows/   Compilación automática (opcional)
```

## 7. Fuentes de datos y atribuciones

- **TMDB** (catálogo). *Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.* Disponibilidad de plataformas: **JustWatch**.
- **iptv-org** (canales de TV: https://github.com/iptv-org/iptv). Los canales pertenecen a sus emisoras; la app no los aloja, solo reproduce sus emisiones públicas y excluye los marcados como adultos o cerrados.
- **hls.js** (reproductor HLS, licencia Apache 2.0).
- **Internet Archive** (cine, documentales, música libre), **LibriVox** (audiolibros), **Audius**, **Jamendo**, **Radio Browser**, directorio de podcasts de **iTunes**.
- **YouTube**: se usa únicamente su reproductor incrustado oficial con enlaces que tú pegas.

## 8. Privacidad y legalidad

- Sin cuentas ni telemetría. Favoritos, listas y claves se guardan en tu equipo.
- La app **no descarga ni extrae** contenido de ningún servicio, y no incluye fuentes piratas. Los servicios de pago o con DRM se abren en su propia web.
- Respeta las condiciones de cada servicio y los derechos de autor de tus archivos locales.

## 9. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| «Falta la clave de TMDB» | Añádela en Ajustes o en `.env` (apartado 2) |
| No aparecen las claves del `.env` | Debe llamarse exactamente `.env`, estar junto al .exe y reiniciar la app |
| Un vídeo local no se ve | Formato no compatible: usa el botón ↗ |
| Un canal de TV no carga | Muchas emisiones caen o se limitan a su país; la app prueba las emisiones alternativas y, si ninguna va, avisa. Se ocultan los canales que exigen cabeceras especiales (referrer/user-agent) |
| Un título no tiene plataformas | No consta en España ahora mismo; TMDB/JustWatch se actualiza a diario |
| La búsqueda de podcasts falla en la web | Usa el .exe |

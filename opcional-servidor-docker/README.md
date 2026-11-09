# Centro multimedia personal

Plataforma gratuita y de código abierto para tener en un solo sitio tus películas, series, documentales, música, podcasts y audiolibros. Funciona igual en Windows, macOS y Linux gracias a Docker.

## Qué incluye

| Servicio | Para qué sirve | Dirección |
|---|---|---|
| **Homepage** | Panel de inicio con todo a un clic | http://localhost:3000 |
| **Jellyfin** | Películas, series y documentales | http://localhost:8096 |
| **Navidrome** | Tu colección de música | http://localhost:4533 |
| **Audiobookshelf** | Podcasts y audiolibros | http://localhost:13378 |

El panel también enlaza servicios de streaming legal y gratuito: RTVE Play, Pluto TV, Tubi, Arte.tv, YouTube, Internet Archive, Jamendo, Free Music Archive, LibriVox y Project Gutenberg.

## Instalación en Windows

1. Instala **Docker Desktop**: https://www.docker.com/products/docker-desktop/ (activa WSL 2 si te lo pide y reinicia).
2. Descomprime esta carpeta donde quieras (por ejemplo `C:\MediaHub`).
3. Haz doble clic en **`iniciar.bat`**. Crea las carpetas y arranca todo.
4. Se abrirá el panel en http://localhost:3000.

## Instalación en macOS / Linux

```bash
chmod +x iniciar.sh
./iniciar.sh
```

## Primer uso

1. Copia tu contenido en las carpetas de `Media/`: `Peliculas`, `Series`, `Documentales`, `Musica`, `Podcasts`, `Audiolibros`.
2. **Jellyfin**: crea tu usuario y añade bibliotecas apuntando a `/media/Peliculas`, `/media/Series`, `/media/Documentales` y `/media/Musica`.
3. **Navidrome**: crea el usuario administrador; la música se detecta sola.
4. **Audiobookshelf**: crea tu usuario y añade bibliotecas en `/audiobooks` (audiolibros) y `/podcasts` (podcasts). Busca podcasts por RSS.

## Apps para móvil y TV

- Jellyfin: app oficial en Android, iOS, Android TV, Fire TV, Roku y Samsung/LG.
- Música (Navidrome): Symfonium, Substreamer o Feishin.
- Podcasts: Audiobookshelf (app oficial) o AntennaPod en Android.

## Usar otra ubicación para tus archivos

Edita `.env` y cambia `MEDIA_PATH`, por ejemplo `MEDIA_PATH=D:/Media`. Usa barras `/` también en Windows.

## Comandos útiles

```bash
docker compose up -d        # arrancar
docker compose down         # parar
docker compose pull && docker compose up -d   # actualizar
docker compose logs -f jellyfin               # ver registros
```

## Acceso desde otros dispositivos de tu casa

Usa la IP de tu portátil, por ejemplo `http://192.168.1.20:8096`. Para que Homepage funcione desde otra IP, añádela en `HOMEPAGE_ALLOWED_HOSTS` en `docker-compose.yml`.

## Aviso legal

Usa esta plataforma con contenido que posees legítimamente, contenido libre o de dominio público y servicios gratuitos legales. Evita fuentes piratas: además del riesgo legal, suelen traer malware.

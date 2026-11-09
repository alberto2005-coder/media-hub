@echo off
REM Prepara carpetas y arranca el centro multimedia (Windows)
cd /d "%~dp0"

if not exist ".env" copy "env.example" ".env" >nul

for %%d in (Peliculas Series Documentales Musica Podcasts Audiolibros) do (
  if not exist "Media\%%d" mkdir "Media\%%d"
)

docker --version >nul 2>&1
if errorlevel 1 (
  echo Docker no esta instalado. Instala Docker Desktop: https://www.docker.com/products/docker-desktop/
  pause
  exit /b 1
)

docker compose up -d
echo.
echo Listo. Abre el panel en http://localhost:3000
start http://localhost:3000
pause

@echo off
REM Une los trozos MediaHub-parte.0, .1, .2... en MediaHub-1.0.0-portable.exe
REM Pon este archivo y los trozos en la misma carpeta y haz doble clic.
cd /d "%~dp0"
copy /b MediaHub-parte.0 + MediaHub-parte.1 + MediaHub-parte.2 + MediaHub-parte.3 + MediaHub-parte.4 MediaHub-1.0.0-portable.exe >nul
if errorlevel 1 (echo Faltan trozos. Comprueba que estan todos en esta carpeta. & pause & exit /b 1)
certutil -hashfile MediaHub-1.0.0-portable.exe SHA256
echo.
echo Compara el hash de arriba con el de MediaHub-1.0.0-portable.exe.sha256.txt
pause

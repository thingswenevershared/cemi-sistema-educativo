@echo off
REM Script para abrir multiples instancias de Chrome para probar el chat en tiempo real
REM Cada instancia tiene su propio perfil de usuario, permitiendo multiples sesiones simultaneas

echo =========================================
echo  TEST DE CHAT MULTIUSUARIO
echo =========================================
echo.
echo Este script abrira 3 instancias de Chrome:
echo   1. Profesor (puerto: 8080)
echo   2. Alumno (puerto: 8080)
echo   3. Admin (puerto: 8080)
echo.
echo Cada instancia tiene su propio perfil, asi que puedes iniciar sesion
echo con diferentes usuarios simultaneamente y probar el chat en tiempo real.
echo.
pause

REM Crear carpetas temporales para perfiles de Chrome si no existen
if not exist "%TEMP%\chrome-profile-1" mkdir "%TEMP%\chrome-profile-1"
if not exist "%TEMP%\chrome-profile-2" mkdir "%TEMP%\chrome-profile-2"
if not exist "%TEMP%\chrome-profile-3" mkdir "%TEMP%\chrome-profile-3"

REM Buscar Chrome en ubicaciones comunes
set CHROME=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else (
    echo ERROR: No se encontro Google Chrome instalado
    echo Por favor instala Chrome o modifica la ruta en este archivo
    pause
    exit
)

echo.
echo Abriendo instancia 1: PROFESOR
start "" %CHROME% --user-data-dir="%TEMP%\chrome-profile-1" --new-window "http://localhost:8080/login.html"
timeout /t 2 /nobreak >nul

echo Abriendo instancia 2: ALUMNO
start "" %CHROME% --user-data-dir="%TEMP%\chrome-profile-2" --new-window "http://localhost:8080/login.html"
timeout /t 2 /nobreak >nul

echo Abriendo instancia 3: ADMIN
start "" %CHROME% --user-data-dir="%TEMP%\chrome-profile-3" --new-window "http://localhost:8080/login.html"

echo.
echo =========================================
echo INSTRUCCIONES DE USO:
echo =========================================
echo.
echo 1. En cada ventana de Chrome, inicia sesion con un usuario diferente:
echo    - Ventana 1: Usuario profesor
echo    - Ventana 2: Usuario alumno  
echo    - Ventana 3: Usuario admin
echo.
echo 2. Los profesores y alumnos deben ir a su dashboard y hacer clic en el
echo    boton de "Chat de Soporte" para abrir el chat.
echo.
echo 3. Envia mensajes desde cualquier usuario y veras como aparecen
echo    EN TIEMPO REAL en las otras ventanas sin necesidad de recargar!
echo.
echo 4. Para cerrar todas las instancias de prueba, cierra este script
echo    y ejecuta: taskkill /F /IM chrome.exe
echo.
echo =========================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul

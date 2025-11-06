@echo off
chcp 65001 >nul
cls

echo.
echo ============================================================
echo     🚀 SISTEMA CEMI - PROYECTO FINAL
echo ============================================================
echo.
echo 📦 Iniciando servidores...
echo.

REM Abrir el navegador en segundo plano después de 3 segundos
start /B cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8080/index.html"

REM Iniciar los servidores (esto bloqueará hasta que presiones Ctrl+C)
npm run dev:all

echo.
echo ============================================================
echo     ✅ SERVIDORES DETENIDOS
echo ============================================================
echo.
echo Presiona cualquier tecla para salir...
pause >nul

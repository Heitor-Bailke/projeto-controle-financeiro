    @echo off
    cd /d "%~dp0"
    start "Backend" cmd /k "cd backend && npm install && node server.js"
    start "Frontend" cmd /k "cd frontend && npm install && npx ng serve --host 0.0.0.0 --port 4200"
    echo.
    echo Aplicacao iniciada.
    echo Backend: http://localhost:3000
    echo Frontend: http://localhost:4200
    echo.
    pause

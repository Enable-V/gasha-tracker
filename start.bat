@echo off
echo HSR Gacha Tracker - Быстрый запуск
echo =====================================

echo.
echo 1. Установка зависимостей...
call npm install
if errorlevel 1 (
    echo Ошибка при установке зависимостей
    pause
    exit /b 1
)

echo.
echo 2. Установка зависимостей клиента...
cd client
call npm install
if errorlevel 1 (
    echo Ошибка при установке зависимостей клиента
    pause
    exit /b 1
)
cd ..

echo.
echo 3. Установка зависимостей сервера...
cd server
call npm install
if errorlevel 1 (
    echo Ошибка при установке зависимостей сервера
    pause
    exit /b 1
)
cd ..

echo.
echo 4. Запуск базы данных...
call docker-compose up -d
if errorlevel 1 (
    echo Ошибка при запуске Docker. Убедитесь, что Docker установлен и запущен.
    pause
    exit /b 1
)

echo.
echo Ожидание запуска MySQL...
timeout /t 10 /nobreak > nul

echo.
echo 5. Запуск приложения...
start "HSR Gacha Tracker" cmd /k "npm run dev"

echo.
echo ✅ Приложение запущено!
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:3001
echo 🗄️ phpMyAdmin: http://localhost:8080
echo.
echo Нажмите любую клавишу для выхода...
pause > nul

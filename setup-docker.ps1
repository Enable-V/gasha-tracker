# HSR Gacha Tracker - Docker Setup Script
# Этот скрипт настраивает Docker для работы с проектом

Write-Host "🚀 Настройка Docker для HSR Gacha Tracker" -ForegroundColor Green

# Добавляем Docker в PATH для текущей сессии
$env:PATH += ";C:\Program Files\Docker\Docker\resources\bin"

# Проверяем, работает ли Docker
Write-Host "⏳ Проверяем состояние Docker..." -ForegroundColor Yellow

$maxAttempts = 12
$attempt = 0

do {
    $attempt++
    Write-Host "Попытка $attempt из $maxAttempts..." -ForegroundColor Gray
    
    try {
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker готов к работе!" -ForegroundColor Green
            break
        }
    }
    catch {
        # Ошибка будет обработана ниже
    }
    
    if ($attempt -lt $maxAttempts) {
        Write-Host "🔄 Docker еще запускается, ждем 10 секунд..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ Docker не запустился. Попробуйте:" -ForegroundColor Red
    Write-Host "1. Убедитесь, что Docker Desktop запущен" -ForegroundColor Yellow
    Write-Host "2. Проверьте, что виртуализация включена в BIOS" -ForegroundColor Yellow
    Write-Host "3. Перезапустите компьютер и попробуйте снова" -ForegroundColor Yellow
    exit 1
}

Write-Host "🐳 Запускаем MySQL и phpMyAdmin..." -ForegroundColor Green

# Запускаем Docker Compose
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Контейнеры запущены успешно!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Доступные сервисы:" -ForegroundColor Cyan
    Write-Host "  • MySQL: localhost:3306" -ForegroundColor White
    Write-Host "  • phpMyAdmin: http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Для остановки контейнеров используйте:" -ForegroundColor Yellow
    Write-Host "  docker-compose down" -ForegroundColor Gray
} else {
    Write-Host "❌ Ошибка при запуске контейнеров" -ForegroundColor Red
    Write-Host "Проверьте логи: docker-compose logs" -ForegroundColor Yellow
}

# Автоматический скрипт для получения HSR URL и импорта данных
param([string]$uid = "123456789")

Write-Host "=== HSR Gacha Auto Import Script ===" -ForegroundColor Cyan
Write-Host ""

# Функция для получения HSR URL
function Get-HSRGachaURL {
    Write-Host "Получение HSR Gacha URL..." -ForegroundColor Yellow
    
    try {
        Write-Host "Выполняется команда получения ссылки..." -ForegroundColor Gray
        
        # Создаем временный файл для выполнения скрипта
        $tempScript = [System.IO.Path]::GetTempFileName() + ".ps1"
        
        # Загружаем скрипт HSR
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        $scriptContent = (New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/scripts/hsr_getlink.ps1')
        Set-Content -Path $tempScript -Value $scriptContent -Encoding UTF8
        
        # Выполняем скрипт и захватываем весь вывод
        $process = Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy", "Bypass", "-File", $tempScript -PassThru -RedirectStandardOutput ([System.IO.Path]::GetTempFileName()) -RedirectStandardError ([System.IO.Path]::GetTempFileName()) -WindowStyle Hidden
        $process.WaitForExit(30000) # Ждем максимум 30 секунд
        
        # Читаем вывод
        $output = ""
        if (Test-Path $process.StartInfo.RedirectStandardOutput) {
            $output = Get-Content $process.StartInfo.RedirectStandardOutput -Raw
        }
        
        # Удаляем временные файлы
        Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
        Remove-Item $process.StartInfo.RedirectStandardOutput -Force -ErrorAction SilentlyContinue
        Remove-Item $process.StartInfo.RedirectStandardError -Force -ErrorAction SilentlyContinue
        
        Write-Host "Получен вывод от HSR скрипта" -ForegroundColor Gray
        
        # Ищем URL в выводе
        if ($output -match '(https://[^\s]*gacha_record[^\s]*)') {
            $url = $Matches[1]
            if ($url -match "authkey=" -and $url.Length -gt 100) {
                Write-Host "Найдена HSR URL!" -ForegroundColor Green
                return $url
            }
        }
        
        # Проверяем буфер обмена как запасной вариант
        try {
            $clipboardContent = Get-Clipboard -ErrorAction SilentlyContinue
            if ($clipboardContent -and ($clipboardContent -match "gacha_record.*authkey=")) {
                Write-Host "URL найдена в буфере обмена!" -ForegroundColor Green
                return $clipboardContent
            }
        } catch {
            Write-Host "Буфер обмена недоступен" -ForegroundColor Yellow
        }
        
        throw "HSR URL не найдена"
    }
    catch {
        Write-Host "Ошибка: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Убедитесь что HSR запущена и история круток была недавно открыта" -ForegroundColor Yellow
        return $null
    }
}

# Создание пользователя
Write-Host "Создание пользователя с UID: $uid" -ForegroundColor Cyan
try {
    $createBody = @{ uid = $uid } | ConvertTo-Json
    $createResult = Invoke-RestMethod -Uri "http://localhost:3001/api/test/create-user" -Method POST -ContentType "application/json" -Body $createBody
    Write-Host "Пользователь создан: $($createResult.user.uid)" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -match "409") {
        Write-Host "Пользователь уже существует" -ForegroundColor Yellow
    } else {
        Write-Host "Ошибка создания пользователя: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Получаем URL автоматически
Write-Host ""
$gachaURL = Get-HSRGachaURL

if ($gachaURL) {
    Write-Host ""
    Write-Host "URL получена, длина: $($gachaURL.Length) символов" -ForegroundColor Gray
    Write-Host ""
    
    # Импорт данных
    Write-Host "Начинаем импорт данных для UID: $uid" -ForegroundColor Cyan
    try {
        $importBody = @{ url = $gachaURL } | ConvertTo-Json
        $importResult = Invoke-RestMethod -Uri "http://localhost:3001/api/upload/url/$uid" -Method POST -ContentType "application/json" -Body $importBody -TimeoutSec 120
        
        Write-Host ""
        Write-Host "🎉 Импорт завершен успешно!" -ForegroundColor Green
        Write-Host "📊 Импортировано: $($importResult.imported)" -ForegroundColor Green
        Write-Host "⏭️  Пропущено: $($importResult.skipped)" -ForegroundColor Yellow
        Write-Host "💾 Сообщение: $($importResult.message)" -ForegroundColor Cyan
        
    } catch {
        Write-Host ""
        Write-Host "❌ Ошибка импорта: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Подробности: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host ""
    Write-Host "❌ Не удалось получить HSR URL автоматически" -ForegroundColor Red
    Write-Host "🔧 Попробуйте запустить команду вручную в новом окне PowerShell:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Set-ExecutionPolicy Bypass -Scope Process -Force" -ForegroundColor Cyan
    Write-Host "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072" -ForegroundColor Cyan  
    Write-Host "iex (New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/scripts/hsr_getlink.ps1')" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Скрипт завершен ===" -ForegroundColor Cyan

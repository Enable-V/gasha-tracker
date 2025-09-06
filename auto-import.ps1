# Автоматический скрипт для получения HSR URL и импорта данных
# HSR Gacha Auto Import Script

$uid = "123456789"

Write-Host "=== HSR Gacha Auto Import Script ===" -ForegroundColor Cyan
Write-Host ""

# Функция для получения HSR URL
function Get-HSRGachaURL {
    Write-Host "Получение HSR Gacha URL..." -ForegroundColor Yellow
    
    try {
        Write-Host "Выполняется команда получения ссылки..." -ForegroundColor Gray
        
        # Простой способ - сохраняем скрипт во временный файл
        $tempScript = [System.IO.Path]::GetTempFileName() + ".ps1"
        
        # Загружаем скрипт
        $scriptContent = (New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/865622de5fcb9b6e2646708a6e1e98e1747cfd64/hsr_getlink.ps1?token=REMOVED_TOKEN')
        Set-Content -Path $tempScript -Value $scriptContent -Encoding UTF8
        
        # Выполняем скрипт и захватываем вывод
        $output = & powershell.exe -ExecutionPolicy Bypass -File $tempScript 2>&1 | Out-String
        
        # Удаляем временный файл
        Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
        
        Write-Host "Полученный вывод:" -ForegroundColor Gray
        $outputLines = $output -split "`n"
        foreach ($line in $outputLines) {
            if ($line.Trim()) {
                Write-Host "   $line" -ForegroundColor DarkGray
            }
        }
        
        # Поиск URL в выводе
        $urlPattern = 'https://[^\s]*gacha_record[^\s]*'
        $matches = [regex]::Matches($output, $urlPattern)
        
        foreach ($match in $matches) {
            $url = $match.Value
            if ($url -match "authkey=" -and $url.Length -gt 100) {
                Write-Host "Найдена подходящая URL!" -ForegroundColor Green
                Write-Host "URL: $($url.Substring(0, 100))..." -ForegroundColor Gray
                return $url
            }
        }
        
        # Проверяем буфер обмена
        try {
            $clipboardContent = Get-Clipboard -ErrorAction SilentlyContinue
            if ($clipboardContent -and ($clipboardContent -match "gacha_record.*authkey=")) {
                Write-Host "URL найдена в буфере обмена!" -ForegroundColor Green
                return $clipboardContent
            }
        } catch {
            Write-Host "Не удалось проверить буфер обмена" -ForegroundColor Yellow
        }
        
        throw "URL не найдена"
    }
    catch {
        Write-Host "Ошибка получения URL: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Убедитесь что:" -ForegroundColor Yellow
        Write-Host "   - Honkai Star Rail запущена" -ForegroundColor Yellow
        Write-Host "   - Вы недавно открывали историю круток в игре" -ForegroundColor Yellow
        Write-Host "   - PowerShell запущен от имени администратора" -ForegroundColor Yellow
        return $null
    }
}

# Создание пользователя
Write-Host "Создание пользователя с UID: $uid" -ForegroundColor Cyan
try {
    $createBody = @{
        uid = $uid
    } | ConvertTo-Json
    
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
$gachaURL = Get-HSRGachaURL

if ($gachaURL) {
    Write-Host ""
    Write-Host "Полученная URL: $($gachaURL.Substring(0, 100))..." -ForegroundColor Gray
    Write-Host ""
    
    # Импорт данных
    Write-Host "Начинаем импорт данных для UID: $uid" -ForegroundColor Cyan
    try {
        $importBody = @{
            url = $gachaURL
        } | ConvertTo-Json
        
        $importResult = Invoke-RestMethod -Uri "http://localhost:3001/api/upload/url/$uid" -Method POST -ContentType "application/json" -Body $importBody -TimeoutSec 120
        
        Write-Host ""
        Write-Host "Импорт завершен успешно!" -ForegroundColor Green
        Write-Host "Импортировано записей: $($importResult.imported)" -ForegroundColor Green
        Write-Host "Пропущено дубликатов: $($importResult.skipped)" -ForegroundColor Yellow
        Write-Host "Общий результат: $($importResult.message)" -ForegroundColor Cyan
        
    } catch {
        Write-Host ""
        Write-Host "Ошибка импорта: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails) {
            Write-Host "Подробности: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host ""
    Write-Host "Не удалось получить HSR URL автоматически" -ForegroundColor Red
    Write-Host "Попробуйте запустить команду вручную в PowerShell:" -ForegroundColor Yellow
    Write-Host 'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString(`"https://raw.githubusercontent.com/Enable-V/honkai/865622de5fcb9b6e2646708a6e1e98e1747cfd64/hsr_getlink.ps1?token=REMOVED_TOKEN`"))}"' -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Скрипт завершен ===" -ForegroundColor Cyan

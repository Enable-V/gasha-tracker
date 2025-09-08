# Автоматический скрипт для получения HSR URL и импорта данных

$uid = "123456789"

Write-Host "=== HSR Gacha Auto Import Script ===" -ForegroundColor Cyan
Write-Host ""

# Функция для получения HSR URL
function Get-HSRGachaURL {
    Write-Host "🔍 Получение HSR Gacha URL..." -ForegroundColor Yellow
    
    try {
        # Выполняем команду для получения URL и захватываем весь вывод
        Write-Host "⚡ Выполняется команда получения ссылки..." -ForegroundColor Gray
        
        # Разбиваем на части для избежания проблем с кавычками
        $policy = "Set-ExecutionPolicy Bypass -Scope Process -Force"
        $security = "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072"
        $download = "(New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/scripts/hsr_getlink.ps1')"
        $execute = "iex `"$download`""
        
        $fullCommand = "$policy; $security; $execute"
        
        $output = Invoke-Expression $fullCommand 2>&1 | Out-String
        
        Write-Host "📄 Полученный вывод:" -ForegroundColor Gray
        $outputLines = $output -split "`n"
        foreach ($line in $outputLines) { 
            if ($line.Trim()) { 
                Write-Host "   $line" -ForegroundColor DarkGray 
            } 
        }
        
        # Ищем URL в выводе более гибко
        $urlPatterns = @(
            'https://public-operation-hkrpg[^\s]+',
            'https://api-os-takumi[^\s]+',
            'https://[^\s]*gacha_record[^\s]*'
        )
        
        foreach ($pattern in $urlPatterns) {
            $matches = [regex]::Matches($output, $pattern)
            foreach ($match in $matches) {
                $url = $match.Value
                if ($url -match "authkey=" -and $url.Length -gt 100) {
                    Write-Host "✅ Найдена подходящая URL!" -ForegroundColor Green
                    Write-Host "🔗 URL: $($url.Substring(0, 100))..." -ForegroundColor Gray
                    return $url
                }
            }
        }
        
        # Если не нашли URL, попробуем извлечь из clipboard
        try {
            $clipboardContent = Get-Clipboard -ErrorAction SilentlyContinue
            if ($clipboardContent -and ($clipboardContent -match "https://.*gacha_record.*authkey=")) {
                Write-Host "✅ URL найдена в буфере обмена!" -ForegroundColor Green
                return $clipboardContent
            }
        } catch {
            Write-Host "⚠️ Не удалось проверить буфер обмена" -ForegroundColor Yellow
        }
        
        throw "URL не найдена ни в выводе команды, ни в буфере обмена"
    }
    catch {
        Write-Host "❌ Ошибка получения URL: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Убедитесь что:" -ForegroundColor Yellow
        Write-Host "   - Honkai Star Rail запущена" -ForegroundColor Yellow
        Write-Host "   - Вы недавно открывали историю круток в игре" -ForegroundColor Yellow
        Write-Host "   - PowerShell запущен от имени администратора" -ForegroundColor Yellow
        return $null
    }
}

# Создание пользователя
Write-Host "👤 Создание пользователя с UID: $uid" -ForegroundColor Cyan
try {
    $createResult = Invoke-RestMethod -Uri "http://localhost:3001/api/test/create-user" -Method POST -ContentType "application/json" -Body "{`"uid`": `"$uid`"}"
    Write-Host "✅ Пользователь создан: $($createResult.user.uid)" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -match "already exists" -or $_.Exception.Message -match "409") {
        Write-Host "ℹ️  Пользователь уже существует" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Ошибка создания пользователя: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Получаем URL автоматически
$gachaURL = Get-HSRGachaURL

if ($gachaURL) {
    Write-Host ""
    Write-Host "🔗 Полученная URL: $($gachaURL.Substring(0, 100))..." -ForegroundColor Gray
    Write-Host ""
    
    # Импорт данных
    Write-Host "📥 Начинаем импорт данных для UID: $uid" -ForegroundColor Cyan
    try {
        $importResult = Invoke-RestMethod -Uri "http://localhost:3001/api/upload/url/$uid" -Method POST -ContentType "application/json" -Body "{`"url`": `"$gachaURL`"}" -TimeoutSec 60
        
        Write-Host ""
        Write-Host "🎉 Импорт завершен успешно!" -ForegroundColor Green
        Write-Host "📊 Импортировано записей: $($importResult.imported)" -ForegroundColor Green
        Write-Host "⏭️  Пропущено дубликатов: $($importResult.skipped)" -ForegroundColor Yellow
        Write-Host "💾 Общий результат: $($importResult.message)" -ForegroundColor Cyan
        
    } catch {
        Write-Host ""
        Write-Host "❌ Ошибка импорта: $($_.Exception.Message)" -ForegroundColor Red
        
        # Детализированная ошибка если доступна
        if ($_.ErrorDetails) {
            Write-Host "📝 Подробности: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host ""
    Write-Host "❌ Не удалось получить HSR URL автоматически" -ForegroundColor Red
    Write-Host "🔧 Попробуйте запустить команду вручную:" -ForegroundColor Yellow
    Write-Host "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex `"&{`$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/scripts/hsr_getlink.ps1'))}`"" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Скрипт завершен ===" -ForegroundColor Cyan

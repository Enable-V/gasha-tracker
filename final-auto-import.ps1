# HSR Auto Import Script - Простая и надежная версия
param([string]$uid = "123456789")

Write-Host "=== HSR Auto Import ===" -ForegroundColor Cyan

# Шаг 1: Создание пользователя
Write-Host "Creating user..." -ForegroundColor Yellow
try {
    $userResult = Invoke-RestMethod -Uri "http://localhost:3001/api/test/create-user" -Method POST -ContentType "application/json" -Body "{`"uid`": `"$uid`"}"
    Write-Host "User created: $uid" -ForegroundColor Green
} catch {
    Write-Host "User exists or error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Шаг 2: Получение HSR URL
Write-Host "Getting HSR URL..." -ForegroundColor Yellow
try {
    # Выполняем скрипт получения URL
    $scriptUrl = "https://raw.githubusercontent.com/Enable-V/honkai/865622de5fcb9b6e2646708a6e1e98e1747cfd64/hsr_getlink.ps1?token=REMOVED_TOKEN"
    $scriptContent = (New-Object System.Net.WebClient).DownloadString($scriptUrl)
    
    # Выполняем скрипт и захватываем вывод
    $output = & ([ScriptBlock]::Create($scriptContent)) 2>&1 | Out-String
    
    Write-Host "Script output:" -ForegroundColor Gray
    Write-Host $output -ForegroundColor DarkGray
    
    # Пробуем получить URL из буфера обмена
    $gachaUrl = Get-Clipboard -ErrorAction SilentlyContinue
    
    if ($gachaUrl -and $gachaUrl.Contains("gacha_record") -and $gachaUrl.Contains("authkey=")) {
        Write-Host "Found URL in clipboard!" -ForegroundColor Green
        Write-Host "URL: $($gachaUrl.Substring(0, 100))..." -ForegroundColor Gray
        
        # Шаг 3: Импорт данных
        Write-Host "Starting import..." -ForegroundColor Yellow
        try {
            $importResult = Invoke-RestMethod -Uri "http://localhost:3001/api/upload/url/$uid" -Method POST -ContentType "application/json" -Body "{`"url`": `"$gachaUrl`"}" -TimeoutSec 120
            
            Write-Host "Import completed!" -ForegroundColor Green
            Write-Host "Imported: $($importResult.imported)" -ForegroundColor Green
            Write-Host "Skipped: $($importResult.skipped)" -ForegroundColor Yellow
            
        } catch {
            Write-Host "Import failed: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.ErrorDetails) {
                Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No valid URL found in clipboard!" -ForegroundColor Red
        Write-Host "Make sure you:" -ForegroundColor Yellow
        Write-Host "1. Have HSR running" -ForegroundColor Yellow
        Write-Host "2. Opened gacha history recently" -ForegroundColor Yellow
        Write-Host "3. Run PowerShell as Administrator" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error getting URL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== Done ===" -ForegroundColor Cyan

# Zenless Zone Zero Signal Search URL Extractor
# ╨б╨║╤А╨╕╨┐╤В ╨┤╨╗╤П ╨┐╨╛╨╗╤Г╤З╨╡╨╜╨╕╤П URL ╨╕╤Б╤В╨╛╤А╨╕╨╕ ╨┐╨╛╨╕╤Б╨║╨░ ╤Б╨╕╨│╨╜╨░╨╗╨╛╨▓ ╨╕╨╖ ╨║╤Н╤И╨░ ZZZ

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Zenless Zone Zero - Signal Search URL  " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ╨Ю╨┐╤А╨╡╨┤╨╡╨╗╤П╨╡╨╝ ╨┐╤Г╤В╤М ╨║ ╨╗╨╛╨│╨░╨╝ ZZZ
$logPaths = @(
    "$env:USERPROFILE\AppData\LocalLow\miHoYo\ZenlessZoneZero\Player.log",
    "$env:USERPROFILE\AppData\LocalLow\Cognosphere\ZenlessZoneZero\Player.log"
)

$logFile = $null
foreach ($path in $logPaths) {
    if (Test-Path $path) {
        $logFile = $path
        Write-Host "[OK] Log file found: $path" -ForegroundColor Green
        break
    }
}

if (-not $logFile) {
    Write-Host "[ERROR] ZZZ log file not found!" -ForegroundColor Red
    Write-Host "Checked paths:" -ForegroundColor Yellow
    foreach ($path in $logPaths) {
        Write-Host "  - $path" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Make sure Zenless Zone Zero is installed and has been launched at least once." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# ╨з╨╕╤В╨░╨╡╨╝ ╨╗╨╛╨│ ╨┤╨╗╤П ╨┐╨╛╨╕╤Б╨║╨░ ╨┐╤Г╤В╨╕ ╨║ ╨┤╨░╨╜╨╜╤Л╨╝ ╨╕╨│╤А╤Л
$logContent = Get-Content $logFile -Raw

# ╨Ш╤Й╨╡╨╝ ╨┐╤Г╤В╤М ╨║ ╨┤╨░╨╜╨╜╤Л╨╝ ZZZ
$gameDataPath = $null
$patterns = @(
    "([A-Z]:[/\\][^\n]*?ZenlessZoneZero_Data)"
)

foreach ($pattern in $patterns) {
    $match = [regex]::Match($logContent, $pattern)
    if ($match.Success) {
        $gameDataPath = $match.Groups[1].Value -replace '/', '\'
        Write-Host "[OK] Game data path: $gameDataPath" -ForegroundColor Green
        break
    }
}

if (-not $gameDataPath) {
    Write-Host "[ERROR] Could not find ZZZ game data path in log file!" -ForegroundColor Red
    Write-Host "Please open ZZZ and visit Signal Search before running this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# ╨Ш╤Й╨╡╨╝ ╤Д╨░╨╣╨╗ ╨║╨╡╤Иa webCaches
# ╨Т ZZZ ╨┐╨░╨┐╨║╨░ webCaches ╨╜╨░╤Е╨╛╨┤╨╕╤В╤Б╤П ╨Т╨Э╨г╨в╨а╨Ш ZenlessZoneZero_Data (╨╜╨╡ ╤А╤П╨┤╨╛╨╝ ╨║╨░╨║ ╨▓ HSR/Genshin)
$webCachePath = Join-Path $gameDataPath "webCaches"
if (-not (Test-Path $webCachePath)) {
    # Fallback: ╨┐╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╤А╤П╨┤╨╛╨╝ ╤Б _Data
    $webCachePath = Join-Path (Split-Path $gameDataPath) "webCaches"
}
Write-Host "[INFO] Looking for web cache in: $webCachePath" -ForegroundColor Cyan

if (-not (Test-Path $webCachePath)) {
    Write-Host "[ERROR] Web cache directory not found!" -ForegroundColor Red
    Write-Host "Please open ZZZ and visit Signal Search History first." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# ╨Ш╤Й╨╡╨╝ ╤Б╨░╨╝╤Г╤О ╤Б╨▓╨╡╨╢╤Г╤О ╨┐╨░╨┐╨║╤Г Cache
$cacheVersionDirs = Get-ChildItem -Path $webCachePath -Directory | Sort-Object Name -Descending
$cacheFile = $null

foreach ($dir in $cacheVersionDirs) {
    $dataFile = Join-Path $dir.FullName "Cache\Cache_Data\data_2"
    if (Test-Path $dataFile) {
        $cacheFile = $dataFile
        Write-Host "[OK] Cache file found: $dataFile" -ForegroundColor Green
        break
    }
}

if (-not $cacheFile) {
    Write-Host "[ERROR] Cache data file not found!" -ForegroundColor Red
    Write-Host "Please open Signal Search History in ZZZ and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# ╨з╨╕╤В╨░╨╡╨╝ ╤Д╨░╨╣╨╗ caches (╨║╨╛╨┐╨╕╤А╤Г╨╡╨╝ ╨▓╨╛ ╨▓╤А╨╡╨╝╨╡╨╜╨╜╤Л╨╣ ╤Д╨░╨╣╨╗, ╤В.╨║. ╨╛╤А╨╕╨│╨╕╨╜╨░╨╗ ╨╝╨╛╨╢╨╡╤В ╨▒╤Л╤В╤М ╨╖╨░╨▒╨╗╨╛╨║╨╕╤А╨╛╨▓╨░╨╜ ╨╕╨│╤А╨╛╨╣)
Write-Host "[INFO] Reading cache file..." -ForegroundColor Cyan
$tmpFile = "$env:TEMP\zzz_data_2"
Copy-Item $cacheFile -Destination $tmpFile -Force
$cacheContent = [System.IO.File]::ReadAllText($tmpFile)

# ╨Ш╤Й╨╡╨╝ URL gacha log
$urlPattern = "https://[^\s\0]+(getGachaLog|gacha)[^\s\0]*authkey=[^\s\0]*"
$foundMatches = [regex]::Matches($cacheContent, $urlPattern)

if ($foundMatches.Count -eq 0) {
    Write-Host "[ERROR] No gacha URL found in cache!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor Yellow
    Write-Host "1. Open Zenless Zone Zero" -ForegroundColor White
    Write-Host "2. Go to Signal Search (gacha) page" -ForegroundColor White
    Write-Host "3. Click on 'History' button" -ForegroundColor White
    Write-Host "4. Wait for history to load" -ForegroundColor White
    Write-Host "5. Run this script again" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

# ╨С╨╡╤А╨╡╨╝ ╨┐╨╛╤Б╨╗╨╡╨┤╨╜╨╕╨╣ (╤Б╨░╨╝╤Л╨╣ ╤Б╨▓╨╡╨╢╨╕╨╣) URL
$gachaUrl = $foundMatches[$foundMatches.Count - 1].Value

# ╨Ю╤З╨╕╤Й╨░╨╡╨╝ URL ╨╛╤В ╨╝╤Г╤Б╨╛╤А╨░ ╨▓ ╨║╨╛╨╜╤Ж╨╡
$cleanUrl = $gachaUrl -replace '["\s\0].*$', ''

# ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ URL
Write-Host ""
Write-Host "[OK] Gacha URL found!" -ForegroundColor Green
Write-Host ""

# ╨в╨╡╤Б╤В╨╕╤А╤Г╨╡╨╝ URL
Write-Host "[INFO] Testing URL validity..." -ForegroundColor Cyan

try {
    Add-Type -AssemblyName System.Web
    
    # ╨д╨╛╤А╨╝╨╕╤А╤Г╨╡╨╝ ╤В╨╡╤Б╤В╨╛╨▓╤Л╨╣ URL ╨┤╨╗╤П ZZZ API
    $testUri = [System.Uri]$cleanUrl
    $testHost = $testUri.Host
    $testParams = [System.Web.HttpUtility]::ParseQueryString($testUri.Query)
    
    $testUrl = "https://$testHost/common/gacha_record/api/getGachaLog?authkey_ver=$($testParams['authkey_ver'])&sign_type=$($testParams['sign_type'])&auth_appid=$($testParams['auth_appid'])&authkey=$([System.Uri]::EscapeDataString($testParams['authkey']))&game_biz=$($testParams['game_biz'])&lang=en&gacha_type=2&real_gacha_type=2&end_id=&page=1&size=5&region=$($testParams['region'])"
    $response = Invoke-RestMethod -Uri $testUrl -Method Get -TimeoutSec 10
    
    if ($response.retcode -eq 0) {
        Write-Host "[OK] URL is valid! API responded successfully." -ForegroundColor Green
        $itemCount = ($response.data.list | Measure-Object).Count
        if ($itemCount -gt 0) {
            Write-Host "[OK] Found $itemCount recent pulls in Exclusive Channel." -ForegroundColor Green
        }
    } else {
        Write-Host "[WARN] API returned: $($response.message)" -ForegroundColor Yellow
        Write-Host "The URL may have expired. Try opening Signal Search History again." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Could not verify URL: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "URL will still be copied - you can try importing it." -ForegroundColor Yellow
}

# ╨Ъ╨╛╨┐╨╕╤А╤Г╨╡╨╝ ╨▓ ╨▒╤Г╤Д╨╡╤А ╨╛╨▒╨╝╨╡╨╜╨░
$cleanUrl | Set-Clipboard

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  URL copied to clipboard!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Paste it into the import form on the website." -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"

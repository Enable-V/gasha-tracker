Add-Type -AssemblyName System.Web

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$logPaths = @(
    "$env:USERPROFILE\AppData\LocalLow\miHoYo\ZenlessZoneZero\Player.log",
    "$env:USERPROFILE\AppData\LocalLow\Cognosphere\ZenlessZoneZero\Player.log"
)

$tmps = $env:TEMP + '\pm.ps1';
if ([System.IO.File]::Exists($tmps)) {
  ri $tmps
}

$logFile = $null
foreach ($path in $logPaths) {
    if (Test-Path $path) {
        $logFile = $path
        break
    }
}

if (-Not $logFile) {
    Write-Host "Cannot find the log file! Make sure to open the signal search history first!" -ForegroundColor Red

    if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-Host "Do you want to try to run the script as Administrator? Press [ENTER] to continue, or any key to cancel."
        $keyInput = [Console]::ReadKey($true).Key
        if ($keyInput -ne "13") {
            return
        }

        $myinvocation.mycommand.definition > $tmps

        Start-Process powershell -Verb runAs -ArgumentList "-noexit", $tmps
        break
    }

    return
}

$logContent = Get-Content $logFile -Raw

$gameDataPath = $null
$patterns = @(
    "([A-Z]:[/\\][^\n]*?ZenlessZoneZero_Data)"
)

foreach ($pattern in $patterns) {
    $match = [regex]::Match($logContent, $pattern)
    if ($match.Success) {
        $gameDataPath = $match.Groups[1].Value -replace '/', '\'
        break
    }
}

if (-not $gameDataPath) {
    Write-Host "Cannot find the signal search url! Make sure to open the signal search history first!" -ForegroundColor Red
    return
}

$webCachePath = Join-Path $gameDataPath "webCaches"
if (-not (Test-Path $webCachePath)) {
    $webCachePath = Join-Path (Split-Path $gameDataPath) "webCaches"
}

if (-not (Test-Path $webCachePath)) {
    Write-Host "Cannot find the signal search url! Make sure to open the signal search history first!" -ForegroundColor Red
    return
}

$cacheVersionDirs = Get-ChildItem -Path $webCachePath -Directory | Sort-Object Name -Descending
$cacheFile = $null

foreach ($dir in $cacheVersionDirs) {
    $dataFile = Join-Path $dir.FullName "Cache\Cache_Data\data_2"
    if (Test-Path $dataFile) {
        $cacheFile = $dataFile
        break
    }
}

if (-not $cacheFile) {
    Write-Host "Cannot find the signal search url! Make sure to open the signal search history first!" -ForegroundColor Red
    return
}

$tmpFile = "$env:TEMP\zzz_data_2"
Copy-Item $cacheFile -Destination $tmpFile -Force
$cacheContent = [System.IO.File]::ReadAllText($tmpFile)

$urlPattern = "https://[^\s\0]+(getGachaLog|gacha)[^\s\0]*authkey=[^\s\0]*"
$foundMatches = [regex]::Matches($cacheContent, $urlPattern)

if ($foundMatches.Count -eq 0) {
    Write-Host "Cannot find the signal search url! Make sure to open the signal search history first!" -ForegroundColor Red
    Remove-Item $tmpFile
    return
}

$linkFound = $false
$cleanUrl = $null

for ($i = $foundMatches.Count - 1; $i -ge 0; $i -= 1) {
    $gachaUrl = $foundMatches[$i].Value
    $cleanUrl = $gachaUrl -replace '["\s\0].*$', ''

    Write-Host "`rChecking Link $i" -NoNewline

    try {
        $testUri = [System.Uri]$cleanUrl
        $testHost = $testUri.Host
        $testParams = [System.Web.HttpUtility]::ParseQueryString($testUri.Query)

        $testUrl = "https://$testHost/common/gacha_record/api/getGachaLog?authkey_ver=$($testParams['authkey_ver'])&sign_type=$($testParams['sign_type'])&auth_appid=$($testParams['auth_appid'])&authkey=$([System.Uri]::EscapeDataString($testParams['authkey']))&game_biz=$($testParams['game_biz'])&lang=en&gacha_type=2&real_gacha_type=2&end_id=&page=1&size=5&region=$($testParams['region'])"
        $response = Invoke-RestMethod -Uri $testUrl -Method Get -TimeoutSec 10

        if ($response.retcode -eq 0) {
            $linkFound = $true
            break
        }
    } catch {
        # continue to next link
    }
    Sleep 1
}

Remove-Item $tmpFile

Write-Host ""

if (-Not $linkFound) {
    Write-Host "Cannot find the signal search url! Make sure to open the signal search history first!" -ForegroundColor Red
    return
}

Write-Host $cleanUrl
Set-Clipboard -Value $cleanUrl
Write-Host "Link copied to clipboard, paste it back to gacha-tracker.ru" -ForegroundColor Green

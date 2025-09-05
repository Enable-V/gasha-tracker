# Simple HSR Auto Import Script
param([string]$uid = "123456789")

Write-Host "HSR Auto Import Starting..." -ForegroundColor Green

# Create user first
Write-Host "Creating user with UID: $uid" -ForegroundColor Cyan
try {
    $body = '{"uid":"' + $uid + '"}'
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/test/create-user" -Method POST -ContentType "application/json" -Body $body
    Write-Host "User created successfully" -ForegroundColor Green
} catch {
    Write-Host "User already exists or error occurred" -ForegroundColor Yellow
}

# Get HSR URL automatically
Write-Host "Getting HSR gacha URL..." -ForegroundColor Cyan

try {
    # Download and execute HSR script
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    $hsrScript = (New-Object System.Net.WebClient).DownloadString('https://gist.githubusercontent.com/MadeBaruna/e017637fbc6c72d47d72ba42dfb2477b/raw/hsr_getlink.ps1')
    
    # Create temp file and execute
    $tempFile = [System.IO.Path]::GetTempFileName() + ".ps1"
    Set-Content -Path $tempFile -Value $hsrScript -Encoding UTF8
    
    # Execute and capture output
    $output = & powershell.exe -ExecutionPolicy Bypass -File $tempFile 2>&1 | Out-String
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    
    Write-Host "HSR script executed" -ForegroundColor Gray
    
    # Find URL in output
    $urlFound = $false
    if ($output -match '(https://[^\s]*gacha_record[^\s]*)') {
        $hsrUrl = $Matches[1]
        if ($hsrUrl -and $hsrUrl.Length -gt 100) {
            Write-Host "Found HSR URL!" -ForegroundColor Green
            $urlFound = $true
        }
    }
    
    # Try clipboard as backup
    if (-not $urlFound) {
        try {
            $clipboard = Get-Clipboard -ErrorAction SilentlyContinue
            if ($clipboard -and $clipboard -match "gacha_record.*authkey=") {
                $hsrUrl = $clipboard
                $urlFound = $true
                Write-Host "Found URL in clipboard!" -ForegroundColor Green
            }
        } catch {
            Write-Host "Clipboard check failed" -ForegroundColor Yellow
        }
    }
    
    if ($urlFound) {
        Write-Host "Importing gacha data..." -ForegroundColor Cyan
        
        $importBody = '{"url":"' + $hsrUrl.Replace('"', '\"') + '"}'
        $importResult = Invoke-RestMethod -Uri "http://localhost:3001/api/upload/url/$uid" -Method POST -ContentType "application/json" -Body $importBody -TimeoutSec 180
        
        Write-Host "Import completed!" -ForegroundColor Green
        Write-Host "Imported: $($importResult.imported)" -ForegroundColor Green
        Write-Host "Skipped: $($importResult.skipped)" -ForegroundColor Yellow
        
    } else {
        Write-Host "HSR URL not found" -ForegroundColor Red
        Write-Host "Make sure HSR is running and gacha history was recently opened" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Script finished" -ForegroundColor Green

# Simple HSR Auto Import Script with Authentication
param(
    [string]$uid = "123456789",
    [string]$username = "Player",
    [string]$email = "",
    [string]$password = "password123"
)

Write-Host "HSR Auto Import with Authentication Starting..." -ForegroundColor Green

# Register or login user
Write-Host "Registering/Logging in user with UID: $uid" -ForegroundColor Cyan
$token = $null

try {
    # Try to register first
    $registerBody = @{
        uid = $uid
        username = $username
        email = $email
        password = $password
    } | ConvertTo-Json
    
    $registerResult = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    $token = $registerResult.token
    Write-Host "User registered successfully" -ForegroundColor Green
} catch {
    Write-Host "Registration failed, trying to login..." -ForegroundColor Yellow
    
    try {
        # Try to login
        $loginBody = @{
            uid = $uid
            password = $password
        } | ConvertTo-Json
        
        $loginResult = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
        $token = $loginResult.token
        Write-Host "User logged in successfully" -ForegroundColor Green
    } catch {
        Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please check your credentials or run with correct parameters" -ForegroundColor Yellow
        return
    }
}

if (-not $token) {
    Write-Host "Authentication failed" -ForegroundColor Red
    return
}

# Get HSR URL automatically
Write-Host "Getting HSR gacha URL..." -ForegroundColor Cyan

try {
    # Download and use HSR script from GitHub
    $hsrScriptUrl = "https://raw.githubusercontent.com/Enable-V/honkai/865622de5fcb9b6e2646708a6e1e98e1747cfd64/hsr_getlink.ps1?token=REMOVED_TOKEN"
    $hsrScriptPath = Join-Path $env:TEMP "hsr_getlink.ps1"
    
    Write-Host "Downloading HSR script..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $hsrScriptUrl -OutFile $hsrScriptPath -UseBasicParsing
    
    if (-Not (Test-Path $hsrScriptPath)) {
        Write-Host "Failed to download HSR script" -ForegroundColor Red
        throw "HSR script download failed"
    }
    
    # Execute downloaded HSR script and capture output
    $output = & powershell.exe -ExecutionPolicy Bypass -File $hsrScriptPath 2>&1 | Out-String
    
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

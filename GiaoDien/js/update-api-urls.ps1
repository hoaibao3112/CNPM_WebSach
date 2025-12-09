# PowerShell script to replace localhost:5000 with dynamic API_CONFIG
# This updates all JavaScript files in GiaoDien/js folder

$jsFolder = "c:\Users\PC\Desktop\CNPM\GiaoDien\js"
$files = Get-ChildItem -Path $jsFolder -Filter "*.js" -File | Where-Object { $_.Name -ne "config.js" }

$replacements = @(
    @{
        Pattern = "const API_URL = 'http://localhost:5000"
        Replacement = "const API_URL = (window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:5000"
        IsConst = $true
    },
    @{
        Pattern = "'http://localhost:5000/"
        Replacement = "(window.API_CONFIG ? window.API_CONFIG.BASE_URL + '/"
        IsConst = $false  
    },
    @{
        Pattern = """http://localhost:5000/""
        Replacement = "(window.API_CONFIG ? window.API_CONFIG.BASE_URL + ""/"
        IsConst = $false
    },
    @{
        Pattern = "http://localhost:5000\`""
        Replacement = "\`${window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:5000'}\`""
        IsConst = $false
    }
)

$totalReplaced = 0
$filesModified = 0

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplaced = 0
    
    # Simple approach: replace all 'http://localhost:5000 with conditional
    $content = $content -replace "'http://localhost:5000", "(\${\window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:5000'\$})"
    $content = $content -replace """http://localhost:5000""", "(\${\window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:5000'\$})"
    $content = $content -replace "``http://localhost:5000", "``\${\window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:5000'\$}"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $filesModified++
        Write-Host "  ✓ Modified" -ForegroundColor Green
    } else {
        Write-Host "  - No changes" -ForegroundColor Gray
    }
}

Write-Host "`n==================================" -ForegroundColor Yellow
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Files modified: $filesModified" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Yellow

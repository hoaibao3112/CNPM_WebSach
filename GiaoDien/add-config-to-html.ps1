# PowerShell script to add config.js and api-patcher.js to all HTML files
# Run this in GiaoDien folder

$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -File | Where-Object { $_.Name -ne "index.html" }

$scriptsToAdd = @"
  
  <!-- API Configuration - MUST load first! -->
  <script src="js/config.js"></script>
  <script src="js/api-patcher.js"></script>
  
"@

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Check if already added
    if ($content -match "config\.js") {
        Write-Host "  - Already has config.js, skipping" -ForegroundColor Gray
        continue
    }
    
    # Add before </body> tag
    if ($content -match "</body>") {
        $content = $content -replace "</body>", "$scriptsToAdd</body>"
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Added config scripts" -ForegroundColor Green
    } else {
        Write-Host "  ✗ No </body> tag found" -ForegroundColor Red
    }
}

Write-Host "`nDone! Check the files above." -ForegroundColor Yellow

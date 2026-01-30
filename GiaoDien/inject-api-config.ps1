# PowerShell script to add config.js and api-patcher.js to all HTML files
$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -Recurse

$configScript = '  <script src="js/config.js"></script>'
$patcherScript = '  <script src="js/api-patcher.js"></script>'

foreach ($file in $htmlFiles) {
    # Skip component files
    if ($file.FullName -like "*components*") {
        Write-Host "Skipping component file: $($file.Name)" -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Check if config.js and api-patcher.js are already present
    if ($content -match "config\.js" -and $content -match "api-patcher\.js") {
        Write-Host "Already has scripts: $($file.Name)" -ForegroundColor Green
        continue
    }
    
    # Find the position to insert (before closing </body> or before first <script>)
    if ($content -match "(?s)(.*?)(<script|</body)") {
        $insertPosition = $content.IndexOf($Matches[2])
        
        # Build the scripts to insert
        $scriptsToInsert = "`r`n  <!-- API Configuration - MUST load first! -->`r`n"
        
        if ($content -notmatch "config\.js") {
            $scriptsToInsert += $configScript + "`r`n"
        }
        
        if ($content -notmatch "api-patcher\.js") {
            $scriptsToInsert += $patcherScript + "`r`n`r`n"
        }
        
        # Insert the scripts
        $newContent = $content.Insert($insertPosition, $scriptsToInsert)
        
        # Save the file
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)" -ForegroundColor Cyan
    }
    else {
        Write-Host "Could not find insertion point in: $($file.Name)" -ForegroundColor Red
    }
}

Write-Host "`nScript execution completed!" -ForegroundColor Green

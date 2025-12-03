$routes = @(
    "categorias.routes.js",
    "despesas.routes.js", 
    "receitas.routes.js",
    "despesas-fixas.routes.js",
    "metas.routes.js",
    "preferencias.routes.js",
    "relatorios.routes.js",
    "admin.routes.js",
    "anexos.routes.js",
    "backup.routes.js",
    "webhook.routes.js"
)

foreach ($route in $routes) {
    $path = ".\routes\$route"
    if (Test-Path $path) {
        Write-Host "Converting $route..." -ForegroundColor Yellow
        
        $content = Get-Content $path -Raw
        $lines = $content -split "`n"
        $result = @()
        
        foreach ($line in $lines) {
            if ($line -match '\?') {
                $newLine = ""
                $paramCount = 0
                $inString = $false
                $stringChar = ""
                
                for ($i = 0; $i -lt $line.Length; $i++) {
                    $char = $line[$i]
                    
                    # Track string context
                    if ($char -match "[`'\\""]" -and ($i -eq 0 -or $line[$i-1] -ne '\')) {
                        if (-not $inString) {
                            $inString = $true
                            $stringChar = $char
                        } elseif ($char -eq $stringChar) {
                            $inString = $false
                            $stringChar = ""
                        }
                    }
                    
                    # Replace ? with $N inside strings
                    if ($char -eq '?' -and $inString) {
                        $paramCount++
                        $newLine += "`$$paramCount"
                    } else {
                        $newLine += $char
                    }
                }
                
                $result += $newLine
            } else {
                $result += $line
            }
        }
        
        $newContent = $result -join "`n"
        
        # Add RETURNING id to INSERT statements
        $newContent = $newContent -replace '(INSERT INTO \w+\s*\([^)]+\)\s*VALUES\s*\([^)]+\))(?!\s*RETURNING)', '$1 RETURNING id'
        
        Set-Content $path $newContent -NoNewline
        Write-Host "✓ Converted $route" -ForegroundColor Green
    } else {
        Write-Host "✗ File not found: $route" -ForegroundColor Red
    }
}

Write-Host "`n✅ All routes converted!" -ForegroundColor Cyan

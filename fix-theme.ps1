# Fix offer-review.css theme
$file = "src/app/pages/offer-review/offer-review.css"
$content = Get-Content $file -Raw

# Fix container background
$content = $content -replace 'background: #f9fafb;', 'background: var(--background-light);'

# Fix card backgrounds  
$content = $content -replace 'background: white;', 'background: var(--background-white);'

# Fix text colors
$content = $content -replace 'color: #1F2937;', 'color: var(--text-dark);'
$content = $content -replace 'color: #374151;', 'color: var(--text-primary);'
$content = $content -replace 'color: #6B7280;', 'color: var(--text-secondary);'

# Fix borders
$content = $content -replace 'border-bottom: 2px solid #F3F4F6;', 'border-bottom: 2px solid var(--border-light);'
$content = $content -replace 'border-bottom: 2px solid #E5E7EB;', 'border-bottom: 2px solid var(--border-light);'

# Fix backgrounds
$content = $content -replace 'background: #F9FAFB;', 'background: var(--background-light);'

Set-Content $file $content -NoNewline

Write-Host "✅ Fixed offer-review.css theme!" -ForegroundColor Green

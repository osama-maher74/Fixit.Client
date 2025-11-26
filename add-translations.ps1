$jsonPath = "c:\Users\عبداللهانورابراهيماب\Desktop\client\Fixit.Client\src\assets\i18n\en.json"
$json = Get-Content $jsonPath -Raw | ConvertFrom-Json

# Add SERVICE and SELECT_SERVICE
$json.REGISTER_CRAFTSMAN | Add-Member -MemberType NoteProperty -Name "SERVICE" -Value "Service" -Force
$json.REGISTER_CRAFTSMAN | Add-Member -MemberType NoteProperty -Name "SELECT_SERVICE" -Value "Select a service" -Force

# Add SERVICE_REQUIRED to VALIDATION
$json.REGISTER_CRAFTSMAN.VALIDATION | Add-Member -MemberType NoteProperty -Name "SERVICE_REQUIRED" -Value "Please select a service" -Force

# Save back
$json | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8
Write-Host "Translation keys added successfully"

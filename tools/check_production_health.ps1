param(
    [string]$FrontendUrl = "https://azubimatcherweb.vercel.app",
    [string]$ApiUrl = "https://azubimatcher-production.up.railway.app"
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Url
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 20
        [pscustomobject]@{
            Name = $Name
            Url = $Url
            StatusCode = [int]$response.StatusCode
            Ok = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
        }
    }
    catch {
        $statusCode = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        [pscustomobject]@{
            Name = $Name
            Url = $Url
            StatusCode = $statusCode
            Ok = $false
        }
    }
}

$checks = @(
    (Test-Endpoint -Name "frontend" -Url $FrontendUrl),
    (Test-Endpoint -Name "api-health" -Url ($ApiUrl.TrimEnd('/') + "/api/health"))
)

$checks | Format-Table -AutoSize

if (($checks | Where-Object { -not $_.Ok }).Count -gt 0) {
    Write-Error "At least one production endpoint check failed."
}

Write-Output "Production endpoints are healthy."

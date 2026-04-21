param(
  [Parameter(Mandatory = $true)]
  [string]$Url,

  [string]$ApiKey = "",
  [string]$LogFile = "",
  [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Write-MonitorLog {
  param(
    [string]$Path,
    [hashtable]$Entry
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return
  }

  $directory = Split-Path -Path $Path -Parent
  if ($directory) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }

  ($Entry | ConvertTo-Json -Compress -Depth 6) | Add-Content -Path $Path -Encoding UTF8
}

function Get-HealthPayloadStatus {
  param(
    [string]$Body
  )

  if ([string]::IsNullOrWhiteSpace($Body)) {
    return @{
      ok = $false
      message = 'Leere Antwort vom Health-Endpunkt.'
    }
  }

  try {
    $payload = ConvertFrom-Json -InputObject $Body -ErrorAction Stop
  } catch {
    return @{
      ok = $false
      message = 'Antwort ist kein gueltiges Health-JSON.'
    }
  }

  if ($payload -and $payload.PSObject.Properties.Match('ok').Count -gt 0) {
    $payloadOk = [bool]$payload.ok
    $payloadMessage = ''
    if (-not $payloadOk) {
      $payloadMessage = 'Health-Endpunkt meldet ok=false.'
    }
    return @{
      ok = $payloadOk
      message = $payloadMessage
    }
  }

  if ($payload -and $payload.PSObject.Properties.Match('result').Count -gt 0 -and $payload.result -and $payload.result.PSObject.Properties.Match('ok').Count -gt 0) {
    $resultOk = [bool]$payload.result.ok
    $resultMessage = ''
    if (-not $resultOk) {
      $resultMessage = 'Deep-Check meldet result.ok=false.'
    }
    return @{
      ok = $resultOk
      message = $resultMessage
    }
  }

  if ($payload -and $payload.PSObject.Properties.Match('error').Count -gt 0 -and -not [string]::IsNullOrWhiteSpace([string]$payload.error)) {
    return @{
      ok = $false
      message = [string]$payload.error
    }
  }

  return @{
    ok = $false
    message = 'Antwort ist kein erwartetes Health-JSON.'
  }
}

$headers = @{
  Accept = 'application/json'
  'User-Agent' = 'AzubiMatchMonitor/1.0'
}

if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
  $headers['X-API-Key'] = $ApiKey
}

$entry = @{
  checkedAt = (Get-Date).ToString('o')
  url = $Url
  ok = $false
  statusCode = $null
  bodyPreview = ''
  error = ''
}

try {
  $response = Invoke-WebRequest -Uri $Url -Headers $headers -UseBasicParsing -TimeoutSec $TimeoutSeconds
  $body = [string]$response.Content
  $statusOk = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
  $healthStatus = Get-HealthPayloadStatus -Body $body

  $entry.ok = ($statusOk -and $healthStatus.ok)
  $entry.statusCode = [int]$response.StatusCode
  $entry.bodyPreview = if ($body.Length -gt 500) { $body.Substring(0, 500) } else { $body }
  if (-not $statusOk) {
    $entry.error = 'HTTP-Status ' + [string]$response.StatusCode
  } elseif (-not $healthStatus.ok) {
    $entry.error = [string]$healthStatus.message
  }
} catch {
  $entry.error = $_.Exception.Message
  if ($_.Exception.Response) {
    try {
      $entry.statusCode = [int]$_.Exception.Response.StatusCode.value__
    } catch {
      $entry.statusCode = $null
    }
  }
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    $detail = [string]$_.ErrorDetails.Message
    $entry.bodyPreview = if ($detail.Length -gt 500) { $detail.Substring(0, 500) } else { $detail }
  }
}

Write-MonitorLog -Path $LogFile -Entry $entry

if (-not $entry.ok) {
  exit 1
}

exit 0
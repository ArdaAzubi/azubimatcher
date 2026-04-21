param(
  [Parameter(Mandatory = $true)]
  [string]$Url,

  [string]$ApiKey = "",
  [Parameter(Mandatory = $true)]
  [string]$StateFile,
  [string]$LogFile = "",
  [int]$MinHours = 1,
  [int]$MaxHours = 3,
  [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = 'Stop'

if ($MinHours -lt 1) {
  throw 'MinHours muss mindestens 1 sein.'
}

if ($MaxHours -lt $MinHours) {
  throw 'MaxHours darf nicht kleiner als MinHours sein.'
}

function Write-DeepState {
  param(
    [string]$Path,
    [hashtable]$State
  )

  $directory = Split-Path -Path $Path -Parent
  if ($directory) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }

  $State | ConvertTo-Json -Depth 6 | Set-Content -Path $Path -Encoding UTF8
}

function Read-DeepState {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return @{}
  }

  try {
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) {
      return @{}
    }

    $data = ConvertFrom-Json -InputObject $raw -ErrorAction Stop
    $result = @{}
    foreach ($property in $data.PSObject.Properties) {
      $result[$property.Name] = $property.Value
    }
    return $result
  } catch {
    return @{}
  }
}

function Write-DeepLog {
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

$state = Read-DeepState -Path $StateFile
$now = Get-Date
$dueAt = $null

if ($state.ContainsKey('nextRunAt') -and $state.nextRunAt) {
  try {
    $dueAt = [datetime]$state.nextRunAt
  } catch {
    $dueAt = $null
  }
}

if ($null -eq $dueAt) {
  $dueAt = $now
}

if ($dueAt -gt $now) {
  Write-DeepLog -Path $LogFile -Entry @{
    checkedAt = $now.ToString('o')
    url = $Url
    skipped = $true
    reason = 'next-run-not-due'
    nextRunAt = $dueAt.ToString('o')
  }
  exit 0
}

$monitorScript = Join-Path $PSScriptRoot 'invoke_monitor_endpoint.ps1'
$powerShellExecutable = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$monitorArguments = @(
  '-NoProfile'
  '-ExecutionPolicy'
  'Bypass'
  '-File'
  $monitorScript
  '-Url'
  $Url
  '-LogFile'
  $LogFile
  '-TimeoutSeconds'
  [string]$TimeoutSeconds
)

if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
  $monitorArguments += @('-ApiKey', $ApiKey)
}

& $powerShellExecutable @monitorArguments
$exitCode = $LASTEXITCODE

$nextDelayHours = Get-Random -Minimum $MinHours -Maximum ($MaxHours + 1)
$nextRunAt = $now.AddHours($nextDelayHours)

Write-DeepState -Path $StateFile -State @{
  lastAttemptAt = $now.ToString('o')
  lastExitCode = $exitCode
  lastUrl = $Url
  minHours = $MinHours
  maxHours = $MaxHours
  nextRunAt = $nextRunAt.ToString('o')
  nextDelayHours = $nextDelayHours
}

if ($exitCode -ne 0) {
  exit $exitCode
}

exit 0
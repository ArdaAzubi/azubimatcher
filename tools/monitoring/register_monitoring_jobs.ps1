param(
  [string]$PublicUrl = 'http://127.0.0.1:8091/healthz.php',
  [string]$DeepUrl = 'http://127.0.0.1:8091/health_monitor.php',
  [string]$DeepApiKey = '',
  [string]$TaskPrefix = 'AzubiMatch',
  [string]$PowerShellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
)

$ErrorActionPreference = 'Stop'

function Get-RepeatingTrigger {
  param(
    [timespan]$Interval,
    [int]$StartDelayMinutes
  )

  return New-ScheduledTaskTrigger -Once `
    -At ((Get-Date).AddMinutes($StartDelayMinutes)) `
    -RepetitionInterval $Interval `
    -RepetitionDuration (New-TimeSpan -Days 3650)
}

function Get-CurrentUserId {
  if (-not [string]::IsNullOrWhiteSpace($env:USERDOMAIN)) {
    return "$($env:USERDOMAIN)\$($env:USERNAME)"
  }
  return $env:USERNAME
}

$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
$logDir = Join-Path $projectRoot 'test-results'
$publicScript = Join-Path $PSScriptRoot 'invoke_monitor_endpoint.ps1'
$deepScript = Join-Path $PSScriptRoot 'invoke_deep_check_randomized.ps1'
$publicLog = Join-Path $logDir 'public-health-job.log'
$deepLog = Join-Path $logDir 'deep-health-job.log'
$deepState = Join-Path $logDir 'deep-health-job-state.json'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$publicTaskName = "$TaskPrefix Public Health 30m"
$deepTaskName = "$TaskPrefix Deep Check 1-3h"
$userId = Get-CurrentUserId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

$publicArguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $publicScript + '" -Url "' + $PublicUrl + '" -LogFile "' + $publicLog + '" -TimeoutSeconds 30'
$deepArguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $deepScript + '" -Url "' + $DeepUrl + '" -StateFile "' + $deepState + '" -LogFile "' + $deepLog + '" -MinHours 1 -MaxHours 3 -TimeoutSeconds 45'

if (-not [string]::IsNullOrWhiteSpace($DeepApiKey)) {
  $deepArguments += ' -ApiKey "' + $DeepApiKey + '"'
}

$publicAction = New-ScheduledTaskAction -Execute $PowerShellPath -Argument $publicArguments
$deepAction = New-ScheduledTaskAction -Execute $PowerShellPath -Argument $deepArguments

$publicTrigger = Get-RepeatingTrigger -Interval (New-TimeSpan -Minutes 30) -StartDelayMinutes 1
$deepTrigger = Get-RepeatingTrigger -Interval (New-TimeSpan -Hours 1) -StartDelayMinutes 5

Register-ScheduledTask `
  -TaskName $publicTaskName `
  -Action $publicAction `
  -Trigger $publicTrigger `
  -Principal $principal `
  -Settings $settings `
  -Description 'AzubiMatch: Oeffentlicher Health-Endpunkt alle 30 Minuten.' `
  -Force | Out-Null

Register-ScheduledTask `
  -TaskName $deepTaskName `
  -Action $deepAction `
  -Trigger $deepTrigger `
  -Principal $principal `
  -Settings $settings `
  -Description 'AzubiMatch: Deep-Check-Runner mit zufaelligem Abstand von 1 bis 3 Stunden.' `
  -Force | Out-Null

[pscustomobject]@{
  PublicTask = $publicTaskName
  PublicUrl = $PublicUrl
  DeepTask = $deepTaskName
  DeepUrl = $DeepUrl
  DeepApiKeyConfigured = -not [string]::IsNullOrWhiteSpace($DeepApiKey)
  PublicLog = $publicLog
  DeepLog = $deepLog
  DeepState = $deepState
} | Format-List | Out-String | Write-Output
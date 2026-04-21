#Requires -Modules Posh-SSH
$ErrorActionPreference = 'Stop'

$hostName        = '5020255023.ssh.w2.strato.hosting'
$userName        = 'su683463'
$password        = ConvertTo-SecureString 'ArdamlA009' -AsPlainText -Force
$credential      = New-Object System.Management.Automation.PSCredential($userName, $password)

$localThemeDir   = 'C:\Users\ardao\Desktop\azubi-match\dist\strato-wordpress\azubimatch-strato'
$remoteThemesDir = '/home/www/public/wp-content/themes'
$themeSlug       = 'azubimatch-strato'
$stamp           = Get-Date -Format 'yyyyMMddHHmmss'
$tempSlug        = $themeSlug + '_tmp_' + $stamp
$backupSlug      = $themeSlug + '_backup_' + $stamp
$localTempDir    = Join-Path (Split-Path $localThemeDir -Parent) $tempSlug

if (Test-Path $localTempDir) { Remove-Item $localTempDir -Recurse -Force }
Copy-Item $localThemeDir $localTempDir -Recurse

function Upload-SFTPDirectory {
    param(
        [int]$SessionId,
        [string]$LocalPath,
        [string]$RemotePath
    )
    try {
        New-SFTPItem -SessionId $SessionId -Path $RemotePath -ItemType Directory -ErrorAction SilentlyContinue | Out-Null
    } catch {}
    Get-ChildItem -LiteralPath $LocalPath | ForEach-Object {
        $remoteChild = $RemotePath + '/' + $_.Name
        if ($_.PSIsContainer) {
            Upload-SFTPDirectory -SessionId $SessionId -LocalPath $_.FullName -RemotePath $remoteChild
        } else {
            Set-SFTPItem -SessionId $SessionId -Path $_.FullName -Destination $RemotePath
        }
    }
}

$sftp = $null
$ssh  = $null
try {
    Write-Host "Verbinde SFTP und SSH..."
    $sftp = New-SFTPSession -ComputerName $hostName -Credential $credential -AcceptKey
    $ssh  = New-SSHSession  -ComputerName $hostName -Credential $credential -AcceptKey

    Write-Host "Lade Theme hoch als $tempSlug ..."
    Upload-SFTPDirectory -SessionId $sftp.SessionId -LocalPath $localTempDir -RemotePath "$remoteThemesDir/$tempSlug"

    $verify = Invoke-SSHCommand -SessionId $ssh.SessionId -Command "find '$remoteThemesDir/$tempSlug' -type f | wc -l"
    $count  = (($verify.Output | Select-Object -Last 1) | Out-String).Trim()
    if (-not $count -or $count -eq '0') { throw 'REMOTE_UPLOAD_EMPTY' }
    Write-Host "Upload OK - $count Dateien hochgeladen."

    $switchCmd = "cd '$remoteThemesDir'; [ -d '$themeSlug' ] && mv '$themeSlug' '$backupSlug'; mv '$tempSlug' '$themeSlug'; find '$themeSlug' -type d -exec chmod 755 {} \;; find '$themeSlug' -type f -exec chmod 644 {} \;; echo 'ACTIVE:$themeSlug'; echo 'BACKUP:$backupSlug'; find '$themeSlug' -type f | wc -l"
    $switch = Invoke-SSHCommand -SessionId $ssh.SessionId -Command $switchCmd
    $switch.Output | ForEach-Object { Write-Host $_ }
    Write-Host "Deploy abgeschlossen."
} finally {
    if ($sftp) { Remove-SFTPSession -SessionId $sftp.SessionId | Out-Null }
    if ($ssh)  { Remove-SSHSession  -SessionId $ssh.SessionId  | Out-Null }
    if (Test-Path $localTempDir) { Remove-Item $localTempDir -Recurse -Force }
}

<#
.SYNOPSIS
  매일 03:00에 backup.ps1을 실행하는 작업 스케줄러 작업을 등록한다.
  이미 등록되어 있으면 갱신한다(멱등).

.사용법 (관리자 권한 PowerShell 5.1)
  cd C:\gachitayo\svc
  .\register-backup-task.ps1
  .\register-backup-task.ps1 -User "GACHITAYO\backup-svc"   # SYSTEM 대신 지정 계정 사용 시
#>

param(
  [string]$User = 'SYSTEM'
)

$ErrorActionPreference = 'Stop'

# --- 관리자 권한 확인 ---
$currentId = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentId)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error '관리자 권한 PowerShell에서 다시 실행하세요.'
    exit 1
}

$TaskName = 'GachitayoBackup'
$ScriptPath = 'C:\gachitayo\svc\backup.ps1'

if (-not (Test-Path -LiteralPath $ScriptPath)) {
    Write-Error "backup.ps1을 찾을 수 없습니다: $ScriptPath (먼저 배치하세요)"
    exit 1
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At '03:00'

if ($User -eq 'SYSTEM') {
    $principalObj = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
} else {
    $principalObj = New-ScheduledTaskPrincipal -UserId $User -LogonType Password -RunLevel Highest
}

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing -ne $null) {
    Write-Host "기존 작업 발견 -> 제거 후 재등록합니다."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principalObj `
    -Description '같이타요 PostgreSQL 매일 백업 (03:00)' | Out-Null

if ($User -ne 'SYSTEM') {
    Write-Warning "지정 계정($User)으로 등록했습니다. 처음 실행 시 Windows가 비밀번호를 요구할 수 있으니,"
    Write-Warning "작업 스케줄러(GUI)에서 해당 작업을 열어 '실행 여부와 상관없이 실행' + 암호 재입력을 한 번 해주세요."
}

Write-Host "등록 완료: $TaskName (매일 03:00, 계정: $User)" -ForegroundColor Green
Get-ScheduledTask -TaskName $TaskName | Format-Table -AutoSize

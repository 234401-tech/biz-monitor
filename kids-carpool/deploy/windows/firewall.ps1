<#
.SYNOPSIS
  같이타요 서버용 방화벽 규칙을 설정한다.
  인터넷에는 80(HTTP, 인증서 발급용)과 443(HTTPS)만 연다.
  3389(RDP), 5432(PostgreSQL), 3000(API)는 열지 않는다 — API는 127.0.0.1에만 바인딩되므로
  방화벽에서 막을 필요조차 없다.

.사용법 (관리자 권한 PowerShell 5.1)
  cd C:\gachitayo\svc
  .\firewall.ps1
#>

$ErrorActionPreference = 'Stop'

# --- 관리자 권한 확인 ---
$currentId = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentId)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error '관리자 권한 PowerShell에서 다시 실행하세요.'
    exit 1
}

$AllowPorts = @(80, 443)

foreach ($port in $AllowPorts) {
    $ruleName = "Gachitayo-Inbound-TCP-$port"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($existing -ne $null) {
        Write-Host "이미 존재함, 건너뜀: $ruleName"
        continue
    }
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $port `
        -Profile Any | Out-Null
    Write-Host "규칙 추가: $ruleName (TCP $port 인바운드 허용)" -ForegroundColor Green
}

Write-Host ""
Write-Host "3389(RDP), 5432(PostgreSQL), 3000(API)는 열지 않았습니다."

# --- 인터넷에 열려있을 수 있는 RDP(3389) 규칙 경고 ---
Write-Host ""
Write-Host "RDP(3389) 인바운드 허용 규칙 점검 중..."
$rdpRules = Get-NetFirewallRule -Direction Inbound -Enabled True -Action Allow -ErrorAction SilentlyContinue |
    Where-Object {
        $portFilter = $_ | Get-NetFirewallPortFilter -ErrorAction SilentlyContinue
        $portFilter -ne $null -and ($portFilter.LocalPort -eq '3389' -or $portFilter.LocalPort -contains '3389')
    }

if ($rdpRules -ne $null -and @($rdpRules).Count -gt 0) {
    Write-Warning '경고: 3389(RDP) 인바운드를 허용하는 방화벽 규칙이 이미 존재합니다.'
    Write-Warning '인터넷(공유기 포트포워딩 등)에 RDP가 노출되어 있다면 랜섬웨어 침입 경로가 됩니다.'
    Write-Warning '아래 규칙을 검토하고, 불필요하면 비활성화하거나 프로필을 Domain/Private로 제한하세요:'
    foreach ($r in $rdpRules) {
        Write-Warning ("  - {0} (Profile: {1}, Enabled: {2})" -f $r.DisplayName, $r.Profile, $r.Enabled)
    }
    Write-Warning '원격 관리는 RDP 대신 Tailscale 같은 VPN을 통해서만 하는 것을 권장합니다 (README 보안 체크리스트 참고).'
} else {
    Write-Host '허용된 RDP(3389) 인바운드 규칙이 발견되지 않았습니다.' -ForegroundColor Green
}

Write-Host ""
Write-Host "완료. 'Get-NetFirewallRule -DisplayName Gachitayo-*' 로 확인할 수 있습니다." -ForegroundColor Green

<#
.SYNOPSIS
  같이타요 API / Caddy 를 WinSW로 윈도우 서비스에 등록하고 시작한다.
  이미 설치돼 있으면 정지 -> 제거 -> 재설치 순으로 다시 설치한다(멱등).

.사용법
  이 스크립트와 gachitayo-api.xml, gachitayo-caddy.xml 을 C:\gachitayo\svc\ 에 둔 뒤
  관리자 권한 PowerShell(5.1)에서 실행한다:

    cd C:\gachitayo\svc
    .\install-services.ps1

.NOTE
  deploy\windows\caddy.xml 은 반드시 gachitayo-caddy.xml 이라는 이름으로
  C:\gachitayo\svc\ 에 복사해야 한다(WinSW는 xml 파일명 = 서비스 실행파일명 규칙을 쓴다).
#>

param(
  [string]$WinswExe = 'C:\gachitayo\svc\WinSW-x64.exe'
)

$ErrorActionPreference = 'Stop'

# 고정 값 (설치 기준 경로)
$SvcDir = 'C:\gachitayo\svc'
$Services = @('gachitayo-api', 'gachitayo-caddy')

# --- 관리자 권한 확인 ---
$currentId = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentId)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error '관리자 권한 PowerShell에서 다시 실행하세요 (Windows 서비스 등록에 필요).'
    exit 1
}

if (-not (Test-Path -LiteralPath $WinswExe)) {
    Write-Error "WinSW 실행파일을 찾을 수 없습니다: $WinswExe (README의 사전 설치 항목을 확인하세요)"
    exit 1
}

$logDir = Join-Path $SvcDir 'logs'
if (-not (Test-Path -LiteralPath $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

foreach ($svcName in $Services) {
    Write-Host "=== $svcName ===" -ForegroundColor Cyan

    $xmlPath = Join-Path $SvcDir ($svcName + '.xml')
    $exePath = Join-Path $SvcDir ($svcName + '.exe')

    if (-not (Test-Path -LiteralPath $xmlPath)) {
        Write-Host "설정 파일이 없습니다: $xmlPath (deploy\windows 의 xml을 이 이름으로 복사하세요)" -ForegroundColor Red
        continue
    }

    # 이미 설치돼 있으면 정지 후 제거 (멱등하게 재설치하기 위함)
    $existingSvc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($existingSvc -ne $null) {
        Write-Host "기존 서비스 발견 -> 정지/제거 후 재설치합니다."
        if (Test-Path -LiteralPath $exePath) {
            try { & $exePath stop } catch { Write-Warning "정지 중 오류(무시): $_" }
            Start-Sleep -Seconds 2
            try { & $exePath uninstall } catch { Write-Warning "제거 중 오류(무시): $_" }
            Start-Sleep -Seconds 2
        } else {
            Write-Warning "$exePath 가 없어 sc.exe로 서비스 등록만 제거합니다."
            & sc.exe delete $svcName | Out-Null
            Start-Sleep -Seconds 2
        }
    }

    # WinSW 실행파일을 서비스 이름으로 복사 (WinSW 규칙: <이름>.exe + <이름>.xml)
    Copy-Item -LiteralPath $WinswExe -Destination $exePath -Force

    Write-Host "설치 중..."
    & $exePath install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$svcName install 실패 (exit $LASTEXITCODE)" -ForegroundColor Red
        continue
    }

    Write-Host "시작 중..."
    & $exePath start
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$svcName start 실패 (exit $LASTEXITCODE). C:\gachitayo\svc\logs 의 로그를 확인하세요." -ForegroundColor Red
        continue
    }

    Start-Sleep -Seconds 2
    Get-Service -Name $svcName | Format-Table -AutoSize
}

Write-Host ""
Write-Host "완료. 'Get-Service gachitayo-api,gachitayo-caddy' 로 상태를 다시 확인할 수 있습니다." -ForegroundColor Green

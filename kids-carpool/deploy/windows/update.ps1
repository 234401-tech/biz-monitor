<#
.SYNOPSIS
  같이타요를 최신 버전으로 업데이트한다.
  git pull -> server 의존성 설치 -> app 빌드 -> www에 배포(robocopy /MIR) ->
  gachitayo-api 서비스 재시작 -> /api/health 확인.

.사용법 (관리자 권한 PowerShell 5.1 권장 — 서비스 재시작 때문)
  cd C:\gachitayo\svc
  .\update.ps1
#>

$ErrorActionPreference = 'Stop'

# 레포(biz-monitor) 최상위를 C:\gachitayo\repo 에 클론했을 때의 경로 —
# kids-carpool 서브폴더 안에 server/app이 있다는 점에 주의.
$RepoDir   = 'C:\gachitayo\repo'
$ServerDir = Join-Path $RepoDir 'kids-carpool\server'
$AppDir    = Join-Path $RepoDir 'kids-carpool\app'
$DistDir   = Join-Path $AppDir 'dist'
$WwwDir    = 'C:\gachitayo\www'

function StepFail($msg) {
    Write-Error $msg
    exit 1
}

Write-Host "=== 1/5 git pull ===" -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $RepoDir)) {
    StepFail "저장소 경로가 없습니다: $RepoDir"
}
Push-Location $RepoDir
git pull
if ($LASTEXITCODE -ne 0) { Pop-Location; StepFail 'git pull 실패' }
Pop-Location

Write-Host "=== 2/5 server 의존성 설치 ===" -ForegroundColor Cyan
Push-Location $ServerDir
npm install --omit=dev
if ($LASTEXITCODE -ne 0) { Pop-Location; StepFail 'server npm install 실패' }
Pop-Location

Write-Host "=== 3/5 app 빌드 ===" -ForegroundColor Cyan
Push-Location $AppDir
npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; StepFail 'app npm install 실패' }
$env:VITE_MODE = 'live'
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; StepFail 'app npm run build 실패' }
Pop-Location

Write-Host "=== 4/5 www에 배포 ===" -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $DistDir)) {
    StepFail "빌드 결과 폴더가 없습니다: $DistDir"
}
# /MIR은 대상에만 있는 파일을 삭제하므로, 대상 경로가 의도한 www 폴더인지 확인 후 실행
if ($WwwDir -ne 'C:\gachitayo\www') {
    StepFail 'WwwDir이 예상 경로(C:\gachitayo\www)가 아닙니다. 중단합니다.'
}
robocopy $DistDir $WwwDir /MIR /NFL /NDL /NJH
if ($LASTEXITCODE -ge 8) {
    StepFail "robocopy 실패 (exit $LASTEXITCODE)"
}

Write-Host "=== 5/5 서비스 재시작 및 확인 ===" -ForegroundColor Cyan
Restart-Service -Name 'gachitayo-api' -Force

$ok = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 1
    try {
        $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/health' -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) { $ok = $true; break }
    } catch {
        # 서버가 아직 기동 중일 수 있음 — 재시도
    }
}

if (-not $ok) {
    StepFail 'gachitayo-api 재시작 후 /api/health 확인 실패. C:\gachitayo\svc\logs 로그를 확인하세요.'
}

Write-Host ""
Write-Host "업데이트 완료. /api/health 정상 응답 확인됨." -ForegroundColor Green

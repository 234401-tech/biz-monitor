<#
.SYNOPSIS
  같이타요 PostgreSQL 데이터베이스를 덤프해서 zip으로 압축 보관한다.
  30일 지난 백업은 자동 삭제하고, -OffsiteDir 을 주면 그곳에도 복사한다(오프사이트 보관용).

.비밀번호 처리 (파일에 저장하지 않는다)
  아래 둘 중 하나를 준비하라:
    1) 환경변수 PGPASSWORD 를 실행 전에 설정
    2) %APPDATA%\postgresql\pgpass.conf 에
       "127.0.0.1:5432:gachitayo:gachitayo:실제비밀번호" 한 줄 작성 (PostgreSQL 표준 방식)
       주의: 작업 스케줄러가 SYSTEM 계정으로 돌면 SYSTEM의 %APPDATA%
       (C:\Windows\System32\config\systemprofile\AppData\Roaming) 에 만들어야 한다.

.사용법
  C:\gachitayo\svc\backup.ps1
  C:\gachitayo\svc\backup.ps1 -OffsiteDir "D:\OffsiteBackup\gachitayo"

.실패 시 exit code 1
#>

param(
  [string]$PgDumpExe  = 'C:\Program Files\PostgreSQL\16\bin\pg_dump.exe',
  [string]$OffsiteDir = ''
)

$ErrorActionPreference = 'Stop'

# 고정 값 (설치 기준: server\.env.example 의 기본 접속 정보, C:\gachitayo\backups)
$PgHostName = '127.0.0.1'
$PgPort     = 5432
$PgUser     = 'gachitayo'
$PgDatabase = 'gachitayo'
$BackupDir  = 'C:\gachitayo\backups'
$RetentionDays = 30

function Fail($msg) {
    Write-Error $msg
    exit 1
}

try {
    if (-not (Test-Path -LiteralPath $PgDumpExe)) {
        Fail "pg_dump.exe를 찾을 수 없습니다: $PgDumpExe (PostgreSQL 버전에 맞게 -PgDumpExe로 지정하세요)"
    }

    if (-not (Test-Path -LiteralPath $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    # 삭제 대상 폴더가 의도한 backups 폴더인지 확인 후 진행 (파괴적 동작 전 검증)
    if ($BackupDir -ne 'C:\gachitayo\backups') {
        Fail "BackupDir이 예상 경로(C:\gachitayo\backups)가 아닙니다. 중단합니다."
    }

    $stamp = Get-Date -Format 'yyyyMMdd-HHmm'
    $sqlPath = Join-Path $BackupDir "gachitayo-$stamp.sql"
    $zipPath = Join-Path $BackupDir "gachitayo-$stamp.zip"

    Write-Host "덤프 중: $PgDatabase -> $sqlPath"
    & $PgDumpExe -h $PgHostName -p $PgPort -U $PgUser -d $PgDatabase -f $sqlPath --no-password
    if ($LASTEXITCODE -ne 0) {
        Fail "pg_dump 실패 (exit $LASTEXITCODE). PGPASSWORD 환경변수 또는 pgpass.conf 설정을 확인하세요."
    }
    if (-not (Test-Path -LiteralPath $sqlPath) -or (Get-Item $sqlPath).Length -eq 0) {
        Fail "덤프 파일이 비어있거나 생성되지 않았습니다: $sqlPath"
    }

    Write-Host "압축 중: $zipPath"
    Compress-Archive -LiteralPath $sqlPath -DestinationPath $zipPath -CompressionLevel Optimal
    if (-not (Test-Path -LiteralPath $zipPath)) {
        Fail "zip 생성에 실패했습니다: $zipPath"
    }

    # 원본 sql은 압축 확인 후 삭제
    Remove-Item -LiteralPath $sqlPath -Force
    Write-Host "완료: $zipPath" -ForegroundColor Green

    # 오프사이트 복사 (서버가 지울 수 없는 외부 저장소 권장 — 클라우드 동기화 폴더 등)
    if ($OffsiteDir -ne '') {
        if (-not (Test-Path -LiteralPath $OffsiteDir)) {
            New-Item -ItemType Directory -Path $OffsiteDir -Force | Out-Null
        }
        Copy-Item -LiteralPath $zipPath -Destination $OffsiteDir -Force
        Write-Host "오프사이트 복사 완료: $OffsiteDir" -ForegroundColor Green
    }

    # 30일 지난 로컬 백업 정리 (오프사이트 사본은 건드리지 않음)
    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    $old = Get-ChildItem -LiteralPath $BackupDir -Filter 'gachitayo-*.zip' -File |
        Where-Object { $_.LastWriteTime -lt $cutoff }
    foreach ($f in $old) {
        Write-Host "보관기간(${RetentionDays}일) 초과, 삭제: $($f.FullName)"
        Remove-Item -LiteralPath $f.FullName -Force
    }

    exit 0
}
catch {
    Write-Error "백업 실패: $_"
    exit 1
}

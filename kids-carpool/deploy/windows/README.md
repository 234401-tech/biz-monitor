# 같이타요 — 윈도우 자체 호스팅 배포 가이드 (도커/WSL 없이)

이 문서는 윈도우 서버(또는 데스크톱) 한 대에 같이타요 API + 프론트 + PostgreSQL을
도커·WSL 없이 직접 설치하는 절차다. 순서대로 따라 하면 된다.

**구성 요약**: 인터넷 → Caddy(80/443, HTTPS 자동 발급) → 정적 프론트 파일 서빙 +
`/api/*`, `/ws` 를 `127.0.0.1:3000`(Node API)로 리버스 프록시. API와 Caddy는
WinSW로 윈도우 서비스 등록. PostgreSQL은 로컬(127.0.0.1)에만 바인딩.

**설치 경로 (고정, 아래 모든 스크립트/설정이 이 경로를 전제로 한다)**

```
C:\gachitayo\
  repo\      ← git clone 결과
  www\       ← 프론트 빌드 결과물 (Caddy가 서빙)
  svc\       ← WinSW 실행파일·설정(xml)·운영 스크립트·logs\
  backups\   ← DB 백업(zip)
  caddy\     ← caddy.exe, Caddyfile
```

**가정한 버전** (다른 버전을 쓰면 경로/명령을 맞게 바꿀 것)
- Node.js 20 LTS
- PostgreSQL 16 (공식 윈도우 설치판)
- WinSW v2.x (단일 exe)
- Caddy 최신 안정판 (윈도우 zip)

---

## 0. 사전 설치

아래를 순서대로 설치/다운로드한다.

1. **Node.js 20 LTS** — https://nodejs.org 에서 Windows Installer(.msi) 다운로드 후 설치.
   설치 후 새 PowerShell 창에서 `node -v` 로 20 이상인지 확인.
2. **Git for Windows** — https://git-scm.com/download/win 에서 설치.
3. **PostgreSQL 16 (Windows installer)** — https://www.postgresql.org/download/windows/
   에서 EDB 설치 마법사로 설치. 설치 중 지정하는 **postgres 슈퍼유저 비밀번호를 반드시 기억**해 둔다.
   기본값(`listen_addresses = 'localhost'`)이면 5432는 로컬에서만 접속 가능하다 —
   `C:\Program Files\PostgreSQL\16\data\postgresql.conf` 에서 이 값이 `localhost`인지 확인한다.
4. **Caddy** — https://caddyserver.com/download 에서 OS: windows, Arch: amd64 선택 후 zip 다운로드.
   압축을 풀어 나온 `caddy.exe`를 `C:\gachitayo\caddy\caddy.exe` 로 복사한다(폴더는 미리 만들어 둔다).
5. **WinSW** — https://github.com/winsw/winsw/releases 에서 최신 v2.x 릴리스의
   `WinSW-x64.exe`를 다운로드하여 `C:\gachitayo\svc\WinSW-x64.exe` 로 저장한다(폴더 미리 생성).

---

## 1. DB와 계정 생성

시작 메뉴의 **SQL Shell (psql)**을 열거나, PowerShell에서 아래처럼 postgres 계정으로 접속한다.

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h 127.0.0.1
```

설치 시 정한 postgres 비밀번호를 입력한 뒤, 아래 SQL을 실행한다.
**`CHANGE_ME`는 반드시 직접 정한 강력한 비밀번호로 교체할 것** — 이 비밀번호를 다음 단계의
`.env`(`DATABASE_URL`)에 그대로 사용한다.

```sql
CREATE USER gachitayo WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE gachitayo OWNER gachitayo;
\q
```

---

## 2. 레포 클론과 server 의존성 설치

```powershell
New-Item -ItemType Directory -Path C:\gachitayo -Force
cd C:\gachitayo
git clone <레포 URL> repo
cd C:\gachitayo\repo\kids-carpool\server
npm install --omit=dev
```

> 저장소 구조상 실제 앱 코드는 `repo\kids-carpool\` 아래에 있다. 이후 모든 경로에서
> `server`는 `C:\gachitayo\repo\kids-carpool\server`, `app`은 `C:\gachitayo\repo\kids-carpool\app`을 뜻한다.
> (WinSW 설정의 `workingdirectory`도 이 경로를 가리키므로, 레포 구조가 바뀌면 `gachitayo-api.xml`도 함께 고쳐야 한다.)

---

## 3. .env 작성

`C:\gachitayo\repo\kids-carpool\server\.env.example`을 같은 폴더에 `.env`로 복사한 뒤 값을 채운다.

```powershell
cd C:\gachitayo\repo\kids-carpool\server
Copy-Item .env.example .env
notepad .env
```

- `DATABASE_URL` — 1단계에서 정한 비밀번호로 교체:
  `postgres://gachitayo:CHANGE_ME@127.0.0.1:5432/gachitayo`
- `JWT_SECRET` — 아래 PowerShell 한 줄로 무작위 문자열을 만들어 붙여넣는다.

  ```powershell
  -join ((48..57)+(97..122) | Get-Random -Count 48 | % {[char]$_})
  ```

- `PORT` — 기본 3000 유지 (127.0.0.1에만 바인딩되며, 방화벽에서 절대 열지 않는다).
- `GROUP_NAME`, `GROUP_SCHOOL`, `INVITE_CODE` — 실제 카풀 그룹 정보로 수정.

---

## 4. 시드 실행

최초 1회, 그룹과 초대코드를 DB에 생성한다.

```powershell
cd C:\gachitayo\repo\kids-carpool\server
npm run seed
```

---

## 5. 프론트 빌드와 www 배포

```powershell
cd C:\gachitayo\repo\kids-carpool\app
npm install
$env:VITE_MODE = 'live'
npm run build
New-Item -ItemType Directory -Path C:\gachitayo\www -Force
robocopy C:\gachitayo\repo\kids-carpool\app\dist C:\gachitayo\www /MIR
```

빌드 결과는 `vite-plugin-singlefile`로 인해 `dist\index.html` 하나(자산 인라인 포함)로 나온다.

---

## 6. Caddyfile 배치와 도메인 수정

```powershell
Copy-Item C:\gachitayo\repo\kids-carpool\deploy\windows\Caddyfile C:\gachitayo\caddy\Caddyfile
notepad C:\gachitayo\caddy\Caddyfile
```

파일 맨 위의 `carpool.example.com`을 실제 도메인으로 바꾼다. (도메인 준비는 8단계 참고.)

---

## 7. WinSW 서비스 설정 배치

```powershell
Copy-Item C:\gachitayo\repo\kids-carpool\deploy\windows\gachitayo-api.xml C:\gachitayo\svc\gachitayo-api.xml
Copy-Item C:\gachitayo\repo\kids-carpool\deploy\windows\caddy.xml C:\gachitayo\svc\gachitayo-caddy.xml
Copy-Item C:\gachitayo\repo\kids-carpool\deploy\windows\install-services.ps1 C:\gachitayo\svc\
Copy-Item C:\gachitayo\repo\kids-carpool\deploy\windows\firewall.ps1 C:\gachitayo\svc\
Copy-Item C:\gachitayo\repo\kids-carpool\deploy\windows\backup.ps1 C:\gachitayo\svc\
Copy-Item C:\gachitayo\repo\kids-carpool\deploy\windows\register-backup-task.ps1 C:\gachitayo\svc\
Copy-Item C:\gachitayo\repo\kids-carpool\deploy\windows\update.ps1 C:\gachitayo\svc\
```

> `caddy.xml`은 반드시 **`gachitayo-caddy.xml`**로 이름을 바꿔 복사한다 — WinSW는
> "xml 파일명 = 생성되는 서비스 실행파일명" 규칙을 쓰기 때문에, `install-services.ps1`이
> 이 이름을 기준으로 동작한다.

`gachitayo-api.xml`을 열어 `<executable>` 경로가 실제 node.exe 위치와 맞는지 확인한다
(보통 `%ProgramFiles%\nodejs\node.exe`가 맞지만, PowerShell에서 `where.exe node`로 확인 가능).
다르면 파일을 수정한다.

---

## 8. 서비스 설치 및 시작

관리자 권한 PowerShell을 열고:

```powershell
cd C:\gachitayo\svc
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-services.ps1
```

`gachitayo-api`, `gachitayo-caddy` 두 서비스가 설치·시작된다. 이미 설치돼 있어도
다시 실행하면 정지→제거→재설치 순으로 안전하게 다시 설치된다(멱등).

---

## 9. 방화벽 설정

```powershell
cd C:\gachitayo\svc
.\firewall.ps1
```

TCP 80/443 인바운드만 허용한다. 3389(RDP)/5432(PostgreSQL)/3000(API)는 열지 않으며,
이미 3389가 인터넷에 열려 있으면 스크립트가 경고를 출력한다.

---

## 10. 백업 등록

```powershell
cd C:\gachitayo\svc
.\register-backup-task.ps1
```

매일 03:00에 `backup.ps1`을 SYSTEM 계정으로 실행하도록 작업 스케줄러에 등록한다(갱신 시 재실행하면 됨).
`backup.ps1`이 pg_dump로 DB 접속 시 비밀번호를 물어보지 않도록, 아래 중 하나를 미리 준비해야 한다
(파일에 비밀번호를 저장하지 않기 위함):

- `%APPDATA%\postgresql\pgpass.conf`에 한 줄 작성:
  `127.0.0.1:5432:gachitayo:gachitayo:실제비밀번호`
  (SYSTEM 계정으로 돌리는 경우 `C:\Windows\System32\config\systemprofile\AppData\Roaming\postgresql\pgpass.conf`에 작성)
- 또는 `backup.ps1`을 감싸는 별도 실행 방식으로 `PGPASSWORD` 환경변수를 설정.

준비가 끝나면 한 번 수동 실행해 확인한다: `C:\gachitayo\svc\backup.ps1`
(`C:\gachitayo\backups\gachitayo-yyyyMMdd-HHmm.zip`이 생기면 성공.)

오프사이트(서버가 지울 수 없는 외부) 사본이 필요하면:
`C:\gachitayo\svc\backup.ps1 -OffsiteDir "D:\경로"` 처럼 직접 실행해 보고,
필요 시 작업 스케줄러의 동작(인수)에 `-OffsiteDir` 인수를 추가한다.

---

## 11. 동작 확인

브라우저에서 `https://<도메인>/api/health` 접속 → `{"ok":true}` 확인.
`https://<도메인>/` 접속 → 앱 화면 로딩 확인, 로그인/초대코드 가입까지 확인.

문제가 있으면 로그 확인:
- `C:\gachitayo\svc\logs\` (gachitayo-api, gachitayo-caddy 서비스 로그)
- `Get-Service gachitayo-api, gachitayo-caddy`

---

## 12. 업데이트 절차

```powershell
cd C:\gachitayo\svc
.\update.ps1
```

`git pull` → server 의존성 재설치 → app 빌드 → `www`에 배포(robocopy `/MIR`) →
`gachitayo-api` 서비스 재시작 → `/api/health` 확인까지 자동으로 수행한다.
(`gachitayo-caddy`는 보통 재시작이 필요 없다 — Caddyfile을 바꾼 경우에만
`Restart-Service gachitayo-caddy`를 수동으로 실행한다.)

---

## 보안 체크리스트

- **인터넷에는 80/443만 연다.** RDP(3389), PostgreSQL(5432), API(3000)는 **절대 개방 금지**.
  API는 127.0.0.1에만 바인딩되어 있으므로 방화벽으로 막을 필요조차 없지만, 실수로
  포트포워딩/방화벽 규칙을 추가하지 않도록 주의한다.
- **원격 관리는 RDP를 인터넷에 열지 말고 Tailscale 같은 VPN을 통해서만** 한다.
- **Windows Update 자동 설치**를 켜 둔다 (설정 → Windows Update → 고급 옵션).
- **Windows Defender(또는 동급 백신)를 켜 둔다.**
- 관리자 계정 비밀번호를 충분히 길고 고유하게 설정하고, 가능하면 로컬 관리자 계정 이름을
  기본값(`Administrator`)에서 바꾼다.
- **백업은 서버 자신이 지울 수 없는 외부**(버전 관리가 되는 클라우드 동기화 폴더, NAS의
  스냅샷 볼륨 등)에도 보관한다 — 랜섬웨어는 로컬 백업 폴더까지 암호화하는 경우가 많다.
  `backup.ps1 -OffsiteDir`으로 사본을 만들되, 대상이 "서버에서 삭제 권한이 없는" 저장소인지 확인할 것.
- **분기 1회 이상 복원 테스트**를 한다 (백업 zip을 다른 환경에 풀어 실제로 복원되는지 확인).
- 가정용 서버라 공유기 뒤에 있다면: 도메인은 저렴한 DDNS(예: 무료 DDNS 서비스)나 일반 도메인 +
  IP 갱신 스크립트로 연결하고, 공유기에서 80/443만 서버 내부IP로 포트포워딩한다(그 외 포트는 포워딩 금지).
- 아동 위치정보를 다루는 서비스이므로 위치기반서비스 사업 신고 등 법적 준비가 필요할 수 있다 —
  자세한 내용은 별도 문서(`research.md`의 규제 관련 절)를 참고할 것. (이 배포 가이드는 인프라만 다룬다.)

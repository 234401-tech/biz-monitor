# 같이타요 (가칭) — 아이 등하원 카풀 앱

이웃 학부모 품앗이 카풀을 조율하는 모바일 앱 기획 자료.

## 폴더 구조

- `research.md` — 해외/국내 상용 솔루션 리서치 (HopSkipDrive, Zum, GoKid, 스쿨버스, 옐로우버스 등), 모델 비교와 MVP 제안

- `app/` — MVP 웹앱 (React + Vite + TypeScript)
  - 실행: `npm install && npm run dev` (개발 서버, 프록시는 127.0.0.1:3300 설정 필요)
  - 빌드 모드:
    - **데모** (기본): 목데이터 사용, `npm run build`로 단일 HTML 번들 생성
    - **라이브**: 실제 API 연결, bash에서 `VITE_MODE=live npm run build`, PowerShell에서 `$env:VITE_MODE='live'; npm run build`

- `server/` — Node.js + Express API 및 WebSocket 서버
  - 셋업: `npm install`, `.env` 작성 (`.env.example` 참고), `npm run seed`로 초기 데이터 생성
  - 실행: `npm start` (포트 3000, 127.0.0.1 루프백)

- `deploy/windows/` — Windows 자체 호스팅 배포 킷 (Caddy + PostgreSQL)
  - 상세 절차는 폴더 내 README.md 참고

- `design/` — 모바일 UI 목업 소스 (5개 화면 플로우 아트보드)
  - `Onboarding.dc.html` — 온보딩 (가치 제안, 4단계 안전 인증 안내)
  - `Main.dc.html` — 홈 (오늘의 카풀 상태, 운전 당번 알림)
  - `LiveTracking.dc.html` — 실시간 위치 (지도, 승하차 타임라인)
  - `Schedule.dc.html` — 주간 당번표 (당번 교환 요청)
  - `DriverProfile.dc.html` — 이웃 프로필 (인증 배지, 차량 정보, 후기)
  - `canvas.json` — 아트보드 배치

## API 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 헬스 체크 |
| POST | `/api/auth/register` | 회원 가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/me` | 현재 사용자 정보 |
| GET | `/api/group` | 카풀 그룹 정보 및 멤버 목록 |
| GET | `/api/week` | 주간 당번표 및 교환 요청 |
| POST | `/api/week/swap` | 당번 교환 요청 |
| POST | `/api/swap/:id/accept` | 교환 수락 |
| GET | `/api/trips/active` | 진행 중인 운행 정보 |
| POST | `/api/trips/start` | 운행 시작 |
| POST | `/api/trips/:id/event` | 운행 이벤트 기록 |
| POST | `/api/trips/:id/end` | 운행 종료 |

**WebSocket**: `/ws` (loc, week, trip 메시지 타입)

## 원칙

- **운행 중에만 위치가 중계되고 저장되지 않는다**: 운행(trip) active 상태일 때만 실시간 위치 공유, 운행 종료 후 위치 기록 미저장

## 디자인

디자인 방향: 딥 그린(신뢰) + 스쿨버스 옐로우(아이·안전), 서체 Jua + IBM Plex Sans KR.
정식 서비스명·수치·인물은 모두 예시 데이터다.

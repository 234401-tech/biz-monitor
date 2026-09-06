# 아이 등하원 카풀 앱 — 상용 솔루션 리서치

> 2026-09-06 조사. 신규 서비스(가칭 "같이타요") 기획을 위한 해외/국내 상용 솔루션 벤치마킹.

## 1. 시장 개요

아이 통학 이동 서비스는 크게 두 모델로 나뉜다.

| 모델 | 설명 | 대표 서비스 | 수익 구조 |
|---|---|---|---|
| **유상 라이드헤일링** (Uber for kids) | 신원 검증된 유급 드라이버가 아이를 운송 | HopSkipDrive, Zum, Kango | 건당 요금 (최소 $16~18/회, 카풀 시 가족당 $7~) |
| **부모 품앗이 카풀** (parent-driven) | 이웃 부모들이 번갈아 운전, 앱은 조율 도구 | GoKid, KidsPool, Carpool.School, Kid Hop, My School Carpool | 무료 + 학교/기관 B2B 구독 |

## 2. 해외 주요 솔루션

### 유상 라이드 (기사 매칭형)

- **HopSkipDrive** — 미국 최대 학생 수송 서비스. 자체 인증 절차(배경조사 + 동승 평가 + 드라이버 교육)를 거친 "CareDriver" 네트워크와 학군(스쿨 디스트릭트) 대상 라우팅 소프트웨어를 함께 판매. 최소 요금 지역별 $16~18, 지연 시 대기비 $10. 개인 대상 건당 과금 + 학교·기관 계약의 이중 수익 구조.
- **Zum** — 만 5세 이상 대상. 개별 라이드는 $18~, 카풀 옵션 시 가족당 $7~. 스쿨버스 대체 B2B 계약으로 확장.
- **Kango** — 라이드 + 돌봄(시터) 결합형. 지문 등록·배경조사를 마친 드라이버의 예약/온디맨드 라이드.

### 부모 품앗이 카풀 (조율 플랫폼형)

- **GoKid** — 미국/캐나다. 핵심 기능 무료, 학교가 "GoKid Connect"를 구독하면 같은 학교 학부모끼리 그룹 매칭. 스케줄 관리, 운전 당번 알림, GPS 실시간 추적 제공.
- **KidsPool** — 검증된 그룹 내 신뢰 기반 카풀 플래너. 스마트 스케줄링, 라이드 상태 실시간 알림, 라이브 트래킹.
- **Carpool.School** — 위치·일정·활동 기반 이웃 가족 매칭. 학교 하교(dismissal) 관리가 특징: 학부모 도착 원탭 알림 → 교직원 실시간 대기열 → 학생별 픽업 디지털 검증(타임스탬프 감사 로그).
- **Kid Hop** — 실시간 GPS 추적 + 개인 캘린더(Google/Apple/Outlook) 연동.

## 3. 국내 현황

- **스쿨버스(safeschoolbus.net)** — 직접 고용 드라이버의 어린이 전용 차량 + 통학차량 관리 앱 '라이드' + AI 안면인식 승하차 플랫폼 '셔틀아이디'. 서울·수도권 위주. 국내에서 가장 프리미엄형.
- **옐로우버스 (리버스랩)** — 학원 셔틀 공유 플랫폼. 여러 학원이 버스를 공동 이용해 좌석 점유율을 높이고 비용 절감, GPS 기반 안전 관리. 2025년 더스윙이 약 130억 원에 인수 — 시장 검증 사례.
- **셔틀타요 (에티켓)** — 학원 통학차량 셰어링. 학원장 비용 절감 + 안전 통학환경 조성 모델로 VC 투자 유치.
- **카찹** — 성인 직장인 카풀/택시팟 중심. 아동 특화 아님.

**국내 시사점:** 국내 상용 서비스는 학원·학교 대상 **B2B 셔틀 공유**에 집중되어 있고, 해외 GoKid류의 **학부모 P2P 품앗이 카풀 조율 앱**은 사실상 공백. 유상 운송은 여객자동차운수사업법상 자가용 유상운송 금지 이슈가 있어, **무상 품앗이(비용 정산 없음) + 조율/안전 도구** 포지셔닝이 규제 리스크가 가장 낮다.

## 4. 공통 핵심 기능 (feature parity 기준선)

1. **신원 검증** — 신분증/면허/보험, (해외) 배경조사·지문. 국내라면 범죄경력회보서·아파트 단지/학교 커뮤니티 인증.
2. **그룹 & 매칭** — 학교/동네/활동 기반 그룹, 초대제 또는 오픈 등록.
3. **스케줄링** — 주간 운전 당번표, 당번 교환 요청, 캘린더 연동, 결석/단축수업 처리.
4. **실시간 추적** — 운행 중 GPS 공유, 도착 ETA.
5. **승하차 알림** — 탑승 완료/하차 완료 자동 푸시, 픽업 검증(감사 로그).
6. **커뮤니케이션** — 그룹 채팅, 운전자 호출.

## 5. MVP 제안 (목업 반영)

- 타깃: 같은 학교·같은 단지 학부모 4~6가족 품앗이 그룹
- 화면 플로우: 온보딩(가치 제안·인증 안내) → 홈(오늘 카풀 상태) → 실시간 위치 → 주간 당번표(교환 요청) → 이웃 프로필(4단계 안전 인증 배지)
- 차별화 후보: 아파트 단지 단위 신뢰 네트워크, 당번 자동 공평 배분, 단축수업·학사일정 자동 반영

## 출처

- [Care.com — Rideshare apps for kids 비교](https://www.care.com/c/ridesharing-apps-for-kids/)
- [The Rideshare Guy — Top rideshare apps for kids](https://therideshareguy.com/top-rideshare-apps-for-kids/)
- [GoKid — 서비스/학교 프로그램](https://gokid.mobi/) · [GoKid vs 유상 서비스 비교](https://gokid.mobi/how-gokid-compares-to-child-driving-services/)
- [510 Families — Bay Area kids rideshare 요금](https://www.510families.com/rideshare-services-bay-area-kids/)
- [Vizologi — HopSkipDrive 비즈니스 모델](https://vizologi.com/business-strategy-canvas/hopskipdrive-business-model-canvas/)
- [Forbes — Zum/Kango/HopSkipDrive 경쟁 구도](https://www.forbes.com/sites/juliewalmsley/2018/10/15/kids-ride-service-race-heats-up-as-zum-expands-to-take-on-kango-hopskipdrive/)
- [KidsPool (App Store)](https://apps.apple.com/us/app/kidspool-carpool-planner/id6475396887) · [Carpool.School (Google Play)](https://play.google.com/store/apps/details?id=school.carpool) · [Kid Hop (Google Play)](https://play.google.com/store/apps/details?id=app.kidplay.kidhop)
- [스쿨버스 — 안전한 어린이 통학 차량](https://www.safeschoolbus.net/)
- [유니콘팩토리 — 더스윙, 옐로우버스 130억 인수](https://www.unicornfactory.co.kr/article/2025012116290155908)
- [플래텀 — 셔틀타요 투자 유치](https://platum.kr/archives/85471)
- [디지털투데이 — 옐로우버스 기업탐방](https://www.digitaltoday.co.kr/news/articleView.html?idxno=242063)

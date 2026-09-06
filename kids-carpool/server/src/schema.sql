CREATE TABLE IF NOT EXISTS groups (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  school      text NOT NULL DEFAULT '',
  invite_code text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            serial PRIMARY KEY,
  group_id      int NOT NULL REFERENCES groups(id),
  phone         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  label         text NOT NULL,           -- 예: "민준 어머니"
  children      text NOT NULL DEFAULT '', -- 쉼표 구분: "김민준(초2), 김소윤(6세)"
  vehicle       text NOT NULL DEFAULT '', -- 예: "기아 카니발 · 32루 4568 · 카시트 2개"
  apt           text NOT NULL DEFAULT '',
  verified      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 주간 당번표: 그룹 × 주 시작일(월요일) × 요일(1=월 ~ 5=금)
CREATE TABLE IF NOT EXISTS week_plans (
  id         serial PRIMARY KEY,
  group_id   int NOT NULL REFERENCES groups(id),
  week_start date NOT NULL,
  dow        int NOT NULL CHECK (dow BETWEEN 1 AND 5),
  driver_id  int NOT NULL REFERENCES users(id),
  riders     text[] NOT NULL DEFAULT '{}',
  note       text NOT NULL DEFAULT '',
  UNIQUE (group_id, week_start, dow)
);

CREATE TABLE IF NOT EXISTS swap_requests (
  id           serial PRIMARY KEY,
  group_id     int NOT NULL REFERENCES groups(id),
  week_start   date NOT NULL,
  from_dow     int NOT NULL,
  to_dow       int NOT NULL,
  requester_id int NOT NULL REFERENCES users(id),
  reason       text NOT NULL DEFAULT '',
  status       text NOT NULL DEFAULT 'pending', -- pending | accepted | cancelled
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trips (
  id         serial PRIMARY KEY,
  group_id   int NOT NULL REFERENCES groups(id),
  driver_id  int NOT NULL REFERENCES users(id),
  kind       text NOT NULL DEFAULT '등원',      -- 등원 | 하원
  status     text NOT NULL DEFAULT 'active',    -- active | ended
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at   timestamptz
);

-- 승하차 기록: 운행 종료 후에도 남는 요약. 위치 좌표는 저장하지 않는다(운행 중 중계만).
CREATE TABLE IF NOT EXISTS trip_events (
  id      serial PRIMARY KEY,
  trip_id int NOT NULL REFERENCES trips(id),
  label   text NOT NULL,
  at      timestamptz NOT NULL DEFAULT now()
);

CREATE SCHEMA IF NOT EXISTS ingreso_personal;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'attendance_action'
      AND n.nspname = 'ingreso_personal'
  ) THEN
    CREATE TYPE ingreso_personal.attendance_action AS ENUM ('IN', 'OUT');
  END IF;
END$$;

SET search_path TO ingreso_personal;

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  qr_token UUID NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  hire_date DATE,
  termination_date DATE,
  pin_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_events (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  action attendance_action NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_time TIMESTAMPTZ,
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  accuracy_m INTEGER
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_time ON attendance_events (employee_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_branch_time ON attendance_events (branch_id, event_time DESC);

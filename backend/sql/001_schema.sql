-- MAS leads: car sale, rental, and repair/service enquiries.
-- Country and city are stored on each row so Muscat / Oman stays explicit.
-- Money is OMR with 3 decimal places.

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  plate_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  model_year INT,
  colour TEXT,
  purpose TEXT NOT NULL CHECK (purpose IN ('SALE', 'RENTAL', 'BOTH')),
  sale_price_omr NUMERIC(12, 3),
  daily_rate_omr NUMERIC(12, 3),
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'IN_GARAGE')),
  branch TEXT NOT NULL DEFAULT 'Muscat'
);

CREATE TABLE doc_counters (
  doc_type TEXT PRIMARY KEY,
  last_number INT NOT NULL
);

CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Oman',
  city TEXT NOT NULL DEFAULT 'Muscat',
  currency TEXT NOT NULL DEFAULT 'OMR',
  area TEXT NOT NULL CHECK (area IN ('CAR_SALE', 'CAR_RENTAL', 'CAR_SERVICE')),
  status TEXT NOT NULL DEFAULT 'NEW_ENQUIRY'
    CHECK (status IN ('NEW_ENQUIRY', 'FOLLOW_UP', 'CONVERTED', 'CANCELLED')),
  follow_up_date DATE,
  notes TEXT,
  customer_id INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL DEFAULT 'Oman',
  city TEXT NOT NULL DEFAULT 'Muscat',
  created_from_lead_id INT REFERENCES leads (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE leads
  ADD CONSTRAINT leads_customer_fk
  FOREIGN KEY (customer_id) REFERENCES customers (id);

-- One real business file per converted lead (sale, rental, or service).
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  lead_id INT NOT NULL UNIQUE REFERENCES leads (id),
  customer_id INT NOT NULL REFERENCES customers (id),
  area TEXT NOT NULL CHECK (area IN ('CAR_SALE', 'CAR_RENTAL', 'CAR_SERVICE')),
  summary TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_sale_details (
  lead_id INT PRIMARY KEY REFERENCES leads (id) ON DELETE CASCADE,
  vehicle_id INT REFERENCES vehicles (id),
  preferred_make TEXT,
  preferred_model TEXT,
  year_from INT,
  year_to INT,
  budget_omr NUMERIC(12, 3)
);

CREATE TABLE lead_rental_details (
  lead_id INT PRIMARY KEY REFERENCES leads (id) ON DELETE CASCADE,
  vehicle_id INT REFERENCES vehicles (id),
  preferred_make TEXT,
  preferred_model TEXT,
  category TEXT,
  start_date DATE NOT NULL,
  duration_days INT NOT NULL CHECK (duration_days BETWEEN 1 AND 365),
  pickup_area TEXT NOT NULL DEFAULT 'Muscat'
);

CREATE TABLE lead_service_details (
  lead_id INT PRIMARY KEY REFERENCES leads (id) ON DELETE CASCADE,
  vehicle_id INT REFERENCES vehicles (id),
  plate_number TEXT,
  make TEXT,
  model TEXT,
  service_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  complaint TEXT
);

CREATE TABLE lead_events (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_area_idx ON leads (area);
CREATE INDEX leads_follow_up_idx ON leads (follow_up_date) WHERE status = 'FOLLOW_UP';
CREATE INDEX leads_created_idx ON leads (created_at DESC);
CREATE INDEX lead_events_lead_idx ON lead_events (lead_id, created_at);

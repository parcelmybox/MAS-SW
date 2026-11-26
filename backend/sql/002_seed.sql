-- Sample Muscat fleet and enquiries so the review screens open with data.

INSERT INTO vehicles (plate_number, make, model, model_year, colour, purpose, sale_price_omr, daily_rate_omr, status, branch) VALUES
  ('A 45210', 'Toyota', 'Land Cruiser', 2023, 'White', 'BOTH', 18500.000, 35.000, 'AVAILABLE', 'Muscat'),
  ('B 22891', 'Toyota', 'Prado', 2022, 'Silver', 'RENTAL', NULL, 28.000, 'AVAILABLE', 'Muscat'),
  ('C 11024', 'Nissan', 'Patrol', 2021, 'Black', 'BOTH', 14500.000, 32.000, 'AVAILABLE', 'Muscat'),
  ('D 90311', 'Hyundai', 'Creta', 2024, 'Blue', 'RENTAL', NULL, 12.000, 'RENTED', 'Muscat'),
  ('E 77420', 'Toyota', 'Yaris', 2023, 'White', 'RENTAL', NULL, 8.000, 'AVAILABLE', 'Muscat'),
  ('F 33018', 'Toyota', 'Hilux', 2022, 'White', 'BOTH', 9500.000, 18.000, 'AVAILABLE', 'Muscat'),
  ('G 61502', 'Lexus', 'LX 600', 2024, 'Pearl', 'SALE', 42000.000, NULL, 'AVAILABLE', 'Muscat'),
  ('H 19077', 'Nissan', 'Sunny', 2020, 'Grey', 'RENTAL', NULL, 7.000, 'IN_GARAGE', 'Muscat');

INSERT INTO leads (reference, name, phone, area, status, follow_up_date, notes, created_at, updated_at) VALUES
  ('MAS-LD-0001', 'Ahmed Al Balushi', '+96891234001', 'CAR_SALE', 'NEW_ENQUIRY', NULL,
    'Asked for the white Land Cruiser on the Muscat lot.', now() - interval '2 hours', now() - interval '2 hours'),
  ('MAS-LD-0002', 'Fatma Al Lawati', '+96892345002', 'CAR_RENTAL', 'FOLLOW_UP', CURRENT_DATE + 1,
    'Family trip. Wants the Prado if it is free.', now() - interval '3 days', now() - interval '1 day'),
  ('MAS-LD-0003', 'Said Al Hinai', '+96893456003', 'CAR_SERVICE', 'FOLLOW_UP', CURRENT_DATE - 1,
    'Called twice. Waiting for him to confirm the service slot.', now() - interval '5 days', now() - interval '1 day'),
  ('MAS-LD-0004', 'Maryam Al Siyabi', '+96894567004', 'CAR_SALE', 'FOLLOW_UP', CURRENT_DATE,
    'Budget is firm. Call this afternoon.', now() - interval '1 day', now() - interval '3 hours'),
  ('MAS-LD-0005', 'John Mathew', '+96895678005', 'CAR_RENTAL', 'CONVERTED', NULL,
    'Short hire while his car is in the workshop.', now() - interval '12 days', now() - interval '10 days'),
  ('MAS-LD-0006', 'Khalid Al Rawahi', '+96896789006', 'CAR_SERVICE', 'CANCELLED', NULL,
    'Brake noise on a private Sunny.', now() - interval '8 days', now() - interval '7 days'),
  ('MAS-LD-0007', 'Aisha Al Habsi', '+96897890007', 'CAR_SALE', 'NEW_ENQUIRY', NULL,
    'Looking at pickup trucks for a small business.', now() - interval '6 hours', now() - interval '6 hours'),
  ('MAS-LD-0008', 'Hassan Al Maskari', '+96898901008', 'CAR_RENTAL', 'CONVERTED', NULL,
    'Needs an SUV for visiting clients around Muscat.', now() - interval '20 days', now() - interval '18 days'),
  ('MAS-LD-0009', 'Noor Al Zadjali', '+96899012009', 'CAR_SERVICE', 'CONVERTED', NULL,
    'Periodic service before a trip to Sohar.', now() - interval '15 days', now() - interval '14 days'),
  ('MAS-LD-0010', 'Salim Al Farsi', '+96890123010', 'CAR_SALE', 'CONVERTED', NULL,
    'Ready to buy the Lexus if the price holds.', now() - interval '9 days', now() - interval '8 days');

INSERT INTO lead_sale_details (lead_id, vehicle_id, budget_omr)
SELECT id, (SELECT id FROM vehicles WHERE plate_number = 'A 45210'), 19000.000
FROM leads WHERE reference = 'MAS-LD-0001';

INSERT INTO lead_sale_details (lead_id, preferred_make, preferred_model, year_from, year_to, budget_omr)
SELECT id, 'Lexus', 'LX', 2022, 2025, 40000.000
FROM leads WHERE reference = 'MAS-LD-0004';

INSERT INTO lead_sale_details (lead_id, preferred_make, preferred_model, year_from, budget_omr)
SELECT id, 'Toyota', 'Hilux', 2020, 11000.000
FROM leads WHERE reference = 'MAS-LD-0007';

INSERT INTO lead_sale_details (lead_id, vehicle_id, budget_omr)
SELECT id, (SELECT id FROM vehicles WHERE plate_number = 'G 61502'), 42000.000
FROM leads WHERE reference = 'MAS-LD-0010';

INSERT INTO lead_rental_details (lead_id, vehicle_id, start_date, duration_days, pickup_area)
SELECT id, (SELECT id FROM vehicles WHERE plate_number = 'B 22891'), CURRENT_DATE + 3, 5, 'Muscat'
FROM leads WHERE reference = 'MAS-LD-0002';

INSERT INTO lead_rental_details (lead_id, vehicle_id, start_date, duration_days, pickup_area)
SELECT id, (SELECT id FROM vehicles WHERE plate_number = 'E 77420'), CURRENT_DATE - 10, 3, 'Muscat'
FROM leads WHERE reference = 'MAS-LD-0005';

INSERT INTO lead_rental_details (lead_id, category, preferred_make, start_date, duration_days, pickup_area)
SELECT id, 'SUV', 'Toyota', CURRENT_DATE - 18, 10, 'Muscat'
FROM leads WHERE reference = 'MAS-LD-0008';

INSERT INTO lead_service_details (lead_id, vehicle_id, plate_number, make, model, service_type, scheduled_date, complaint)
SELECT id, (SELECT id FROM vehicles WHERE plate_number = 'H 19077'), 'H 19077', 'Nissan', 'Sunny',
  'Brake repair', CURRENT_DATE + 2, 'Grinding noise from the front brakes.'
FROM leads WHERE reference = 'MAS-LD-0003';

INSERT INTO lead_service_details (lead_id, plate_number, make, model, service_type, scheduled_date, complaint)
SELECT id, 'R 88211', 'Nissan', 'Sunny', 'Brake repair', CURRENT_DATE - 6, 'Customer heard a grind at low speed.'
FROM leads WHERE reference = 'MAS-LD-0006';

INSERT INTO lead_service_details (lead_id, plate_number, make, model, service_type, scheduled_date, complaint)
SELECT id, 'M 44120', 'Toyota', 'Camry', 'Periodic service', CURRENT_DATE - 14, '10,000 km service and AC check.'
FROM leads WHERE reference = 'MAS-LD-0009';

INSERT INTO customers (reference, name, phone, created_from_lead_id, created_at)
SELECT 'MAS-CU-0001', name, phone, id, converted_stamp
FROM (
  SELECT id, name, phone, now() - interval '10 days' AS converted_stamp FROM leads WHERE reference = 'MAS-LD-0005'
) t;

INSERT INTO customers (reference, name, phone, created_from_lead_id, created_at)
SELECT 'MAS-CU-0002', name, phone, id, now() - interval '18 days' FROM leads WHERE reference = 'MAS-LD-0008';

INSERT INTO customers (reference, name, phone, created_from_lead_id, created_at)
SELECT 'MAS-CU-0003', name, phone, id, now() - interval '14 days' FROM leads WHERE reference = 'MAS-LD-0009';

INSERT INTO customers (reference, name, phone, created_from_lead_id, created_at)
SELECT 'MAS-CU-0004', name, phone, id, now() - interval '8 days' FROM leads WHERE reference = 'MAS-LD-0010';

UPDATE leads SET
  status = 'CONVERTED',
  customer_id = (SELECT id FROM customers WHERE reference = 'MAS-CU-0001'),
  converted_at = now() - interval '10 days',
  follow_up_date = NULL
WHERE reference = 'MAS-LD-0005';

UPDATE leads SET
  customer_id = (SELECT id FROM customers WHERE reference = 'MAS-CU-0002'),
  converted_at = now() - interval '18 days'
WHERE reference = 'MAS-LD-0008';

UPDATE leads SET
  customer_id = (SELECT id FROM customers WHERE reference = 'MAS-CU-0003'),
  converted_at = now() - interval '14 days'
WHERE reference = 'MAS-LD-0009';

UPDATE leads SET
  customer_id = (SELECT id FROM customers WHERE reference = 'MAS-CU-0004'),
  converted_at = now() - interval '8 days'
WHERE reference = 'MAS-LD-0010';

UPDATE leads SET
  status = 'CANCELLED',
  cancelled_at = now() - interval '7 days',
  cancel_reason = 'Customer repaired the car at another workshop.'
WHERE reference = 'MAS-LD-0006';

INSERT INTO businesses (reference, lead_id, customer_id, area, summary, opened_at)
SELECT 'MAS-RN-0001', l.id, c.id, 'CAR_RENTAL',
  'Rental of Toyota Yaris E 77420 for 3 days from Muscat.',
  l.converted_at
FROM leads l JOIN customers c ON c.reference = 'MAS-CU-0001'
WHERE l.reference = 'MAS-LD-0005';

INSERT INTO businesses (reference, lead_id, customer_id, area, summary, opened_at)
SELECT 'MAS-RN-0002', l.id, c.id, 'CAR_RENTAL',
  'SUV rental, Toyota preferred, 10 days, pickup in Muscat.',
  l.converted_at
FROM leads l JOIN customers c ON c.reference = 'MAS-CU-0002'
WHERE l.reference = 'MAS-LD-0008';

INSERT INTO businesses (reference, lead_id, customer_id, area, summary, opened_at)
SELECT 'MAS-SV-0001', l.id, c.id, 'CAR_SERVICE',
  'Periodic service for Toyota Camry M 44120.',
  l.converted_at
FROM leads l JOIN customers c ON c.reference = 'MAS-CU-0003'
WHERE l.reference = 'MAS-LD-0009';

INSERT INTO businesses (reference, lead_id, customer_id, area, summary, opened_at)
SELECT 'MAS-SL-0001', l.id, c.id, 'CAR_SALE',
  'Sale of Lexus LX 600 G 61502.',
  l.converted_at
FROM leads l JOIN customers c ON c.reference = 'MAS-CU-0004'
WHERE l.reference = 'MAS-LD-0010';

INSERT INTO lead_events (lead_id, event_type, to_status, note, created_at)
SELECT id, 'CREATED', 'NEW_ENQUIRY', 'Enquiry received in Muscat.', created_at FROM leads;

INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, follow_up_date, created_at)
SELECT id, 'FOLLOW_UP_SET', 'NEW_ENQUIRY', 'FOLLOW_UP', 'Promised a call about the Prado.', follow_up_date, created_at + interval '1 day'
FROM leads WHERE reference = 'MAS-LD-0002';

INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, follow_up_date, created_at)
SELECT id, 'FOLLOW_UP_SET', 'NEW_ENQUIRY', 'FOLLOW_UP', 'First call missed. Try again.', follow_up_date, created_at + interval '2 days'
FROM leads WHERE reference = 'MAS-LD-0003';

INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, follow_up_date, created_at)
SELECT id, 'FOLLOW_UP_SET', 'NEW_ENQUIRY', 'FOLLOW_UP', 'Asked us to call today with LX options.', follow_up_date, updated_at
FROM leads WHERE reference = 'MAS-LD-0004';

INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, created_at)
SELECT id, 'CONVERTED', 'FOLLOW_UP', 'CONVERTED', 'Rental file opened. Lead is now a customer.', converted_at
FROM leads WHERE reference = 'MAS-LD-0005';

INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, created_at)
SELECT id, 'CANCELLED', 'FOLLOW_UP', 'CANCELLED', cancel_reason, cancelled_at
FROM leads WHERE reference = 'MAS-LD-0006';

INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, created_at)
SELECT id, 'CONVERTED', 'NEW_ENQUIRY', 'CONVERTED', 'Rental agreement started from this enquiry.', converted_at
FROM leads WHERE reference = 'MAS-LD-0008';

INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, created_at)
SELECT id, 'CONVERTED', 'FOLLOW_UP', 'CONVERTED', 'Workshop job opened for the Camry.', converted_at
FROM leads WHERE reference = 'MAS-LD-0009';

INSERT INTO lead_events (lead_id, event_type, from_status, to_status, note, created_at)
SELECT id, 'CONVERTED', 'FOLLOW_UP', 'CONVERTED', 'Sale file opened for the Lexus.', converted_at
FROM leads WHERE reference = 'MAS-LD-0010';

INSERT INTO doc_counters (doc_type, last_number) VALUES
  ('LEAD', 10),
  ('CUSTOMER', 4),
  ('SALE', 1),
  ('RENTAL', 2),
  ('SERVICE', 1);

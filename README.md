# MAS Leads

Leads module for MAS in Muscat. A lead is a person asking about a **car sale**, a **car rental**, or a **car repair / service**. Currency is OMR. Country is Oman and the city is Muscat.

When a lead becomes real business, the system creates a customer and one business file (sale `MAS-SL`, rental `MAS-RN`, or service `MAS-SV`). The dashboard counts how many leads make that step.

## Screens for review

- **Dashboard** — totals, conversion rate by area, and the latest leads.
- **All leads** — every enquiry, with filters for status and area.
- **Follow-ups** — open follow-ups sorted by date, overdue first.
- **New lead** — name, Oman phone, and the fields for sale, rental, or service.
- **Lead** — the enquiry, its history, and the actions follow-up, convert, or cancel.

## Lead states

| State | Meaning |
| --- | --- |
| New enquiry | Just recorded. |
| Follow-up | A follow-up date is set. |
| Converted to business | Customer + sale, rental, or service file. |
| Cancelled | Closed with a reason. |

A new enquiry or a follow-up can move to follow-up (including a new date), converted, or cancelled. Converted and cancelled leads stay as history.

## Tables

- `leads` — name, phone, area, status, follow-up date.
- `lead_sale_details` — a stock car and/or make, model, year, budget.
- `lead_rental_details` — a stock car and/or preferences, start date, duration, Muscat pickup.
- `lead_service_details` — plate or fleet car, service, scheduled date.
- `customers` — created when a lead converts. The same phone is reused.
- `businesses` — the sale, rental, or service file tied to that lead.
- `lead_events` — each status change.
- `vehicles` — Muscat cars a lead can point at.

## Run it

```bash
docker compose up -d
cd backend && npm install && npm test && npm start
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. The API is http://localhost:4000 and uses `postgres://mas:mas@localhost:5432/mas`. Sample enquiries load on the first start.

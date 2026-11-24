# Best Architecture to Build in Cursor Pro (Deployed on Contabo)

## Software & Deployment Links

- **Software (Cursor):** https://cursor.com/download
- **Deployment / VPS Hosting (Contabo):** https://contabo.com/en-us/?gad_source=1&gad_campaignid=23972182501&gbraid=0AAAAAD_Qy-ePfP6AHpeCaoFm80gu8XEPf&gclid=Cj0KCQiA5NXXBhDEARIsABAJhdK4sNcI9Xl5F9CJmKMnbBAg5nr_7nE93mQKEkLzSkjjTd1jLyiu82MaAhMcEALw_wcB

---

## 1. Recommended Architecture

To finish both the web frontend and mobile app within **1 month**, avoid building two separate codebases. Use a unified JavaScript/TypeScript stack so Cursor Pro can share business logic across everything.

### Database & API Backend
- PostgreSQL + Prisma (or Supabase Self-Hosted)
- Running in Docker on your Contabo VPS
- Stores:
  - Vehicles
  - Mulkiya and insurance dates
  - Customer Civil IDs / Passports
  - Rental contracts
  - Garage job cards
  - Spare parts inventory
  - Financial ledgers

### Web Frontend — Office, Counter & Accountant Portal
- Next.js (React)
- Used for:
  - Rental scheduling
  - Bilingual English/Arabic 5% VAT PDF invoices
  - ROP fines logging
  - Excel report exports

### Mobile App — Mechanics & Vehicle Handover Staff
- Progressive Web App (PWA) built directly inside Next.js, or Expo (React Native).

### Pro Tip for a 1-Month Timeline

Building your web frontend as a mobile-responsive PWA allows mechanics and handover agents to install it directly onto their iOS/Android home screens.

They can:
- Take vehicle damage photos using the phone camera.
- Update job cards.
- Check vehicle status.
- Avoid waiting weeks for Apple App Store or Google Play Store review approvals.

---

# Pre-Implementation Guide

This guide is designed for a non-technical team and an accountant-owner. It covers Cursor Pro fundamentals, non-technical app design, core workflows, and an incremental, phased rollout plan so you can launch one working use case on Contabo first and expand safely.

---

# Part 1: Cursor Pro Fundamentals (For Non-Coders)

Think of Cursor Pro not as a coding tool, but as a junior software developer sitting beside you.

**You are the Product Manager and Accountant; Cursor writes the code based on your instructions.**

## 1. The 3 Core Features You Will Use Daily

### Agent Mode (Cmd/Ctrl + I)
Your main workspace.

You type instructions in plain English, and Cursor creates or edits multiple files automatically.

**Example:**
> Create a vehicle check-out form that saves pickup time and odometer reading.

### Chat Mode (Cmd/Ctrl + L)
Your Q&A advisor.

Use this to ask questions without changing code.

**Examples:**
- Explain how this database table calculates 5% VAT.
- Why is this page showing an error?

### Context Tagging (@ Symbol)
Typing `@` lets you point Cursor to specific files or folders (like `@schema.prisma` or `@.cursorrules`) so it follows your exact accounting and Oman business rules every time.

## 2. Golden Rules for Prompting Cursor

### Set `.cursorrules` First
Create a plain text file named `.cursorrules` in your main project folder before building anything.

Put your permanent rules inside:
- 3-decimal OMR precision (`0.000`)
- 5% Oman VAT
- Bilingual English/Arabic invoice fields
- No deleting financial records

Cursor reads these rules as project guidance.

### Build One Screen at a Time
Never ask Cursor to build the entire rental and garage app at once.

Instead:
1. Build one database table.
2. Test it.
3. Build one form.
4. Test it.

### Save Checkpoints with Git
Before asking Cursor for a big change, save a checkpoint (commit) in GitHub.

If Cursor breaks something, you can revert to your last working version.

---

# Part 2: App Design for Non-Technical Users

Since your staff includes counter agents, mechanics, and an accountant-owner, the interface must be simple, fast, and mistake-proof.

## 1. Role-Based Screens (Show Only What Each Person Needs)

### Rental Counter Agent View
- Fleet Availability Board
- Check-Out / Check-In Forms
- Customer ID Capture
- Cannot see company profit margins
- Cannot edit past invoices

### Garage Mechanic View (Mobile PWA)
- Opens on a phone or tablet with large touch buttons
- Assigned Job Cards
- Parts Used
- Vehicle Status Toggle (`In Progress → Ready`)

### Accountant / Owner View
- Full access to:
  - 5% VAT Invoices
  - Security Deposit Ledger
  - ROP Traffic Fine Deductions
  - Per-Vehicle Profitability
  - One-Click Excel (`.xlsx`) Exports

## 2. UX Design Principles for Daily Operations

### Mobile-First PWA (Progressive Web App)
Instead of building separate iOS and Android apps (which delays launch), design the app as a responsive web app that installs directly onto phone home screens.

Staff can:
- Snap photos of Oman Civil IDs.
- Photograph Mulkiya cards.
- Capture vehicle scratches and damage.
- Update records from their phones.

### Smart Validation & Guardrails
- Prevent saving a rental if the customer's driver's license is expired.
- Automatically lock a vehicle from rental bookings when a garage job card is opened for that plate number.
- Format money inputs strictly to 3 decimal places (`0.000 OMR`).

---

# Part 3: Core Workflow Designs

Before writing code, map out how data moves through your business so Cursor builds the exact logic you need.

## Workflow A: Rental Check-Out & Check-In (With ROP Fine Protection)

### 1. Booking & ID Capture
- Agent selects an `AVAILABLE` car.
- Enters customer details.
- Scans Oman Civil ID / Resident Card / Passport.
- System verifies license expiry.

### 2. Handover (Check-Out)
System records:
- Exact date and timestamp (down to the minute)
- Starting odometer
- Fuel level
- Four-side walkaround photos
- Customer digital signature on tablet/phone

### 3. Deposit & Advance Payment
System records:
- Security deposit hold
- Rental fee
- 5% Oman VAT

Vehicle status changes to `RENTED`.

### 4. Return (Check-In)
Agent logs:
- Exact return timestamp
- Ending odometer
- Return photos

System:
- Calculates extra days/km.
- Generates final Oman VAT Tax Invoice.

### 5. Post-Rental ROP Fine Check
If a speed/traffic fine appears later on the ROP portal:

- Accountant enters the fine's timestamp and plate number.
- App automatically matches it to the renter who had the car at that exact minute.
- Fine is recorded against the renter.
- Fine amount is deducted from their held deposit, subject to the contract and applicable rules.

---

## Workflow B: Garage Workshop Job Card (External & Internal Fleet)

### 1. Job Creation
Service advisor enters plate number.

System detects whether the vehicle is:
- External Customer Car
- Internal Rental Fleet Car

### 2. Fleet Block (If Internal)
If it is a rental car:

- Vehicle status automatically changes to `IN_GARAGE`.
- Rental calendar blocks new bookings for the vehicle.

### 3. Repair & Parts Logging
Mechanic logs:
- Labor hours
- Spare parts used

Inventory quantities are automatically deducted.

### 4. Billing vs. Internal Costing

#### External Car
- Generates customer 5% VAT Tax Invoice.
- Includes parts + labor + 5% VAT.
- Currency: OMR.

#### Internal Rental Car
- Logs parts and labor as a maintenance expense tied to that specific vehicle's profit/loss ledger.
- No external customer VAT invoice is generated.
- Vehicle returns to `AVAILABLE` when service is completed and authorized.

---

# Part 4: Incremental Delivery Plan (Phased Model)

Do not try to launch everything on Day 1.

Use a **4-Phase Incremental Rollout** on your Contabo VPS. Each phase gives you a working, live tool within approximately one week.

---

## Phase 1 (Week 1): Fleet Master & Car Rental Check-Out/Check-In (MVP)

### Goal
Replace paper/Excel rental agreements first.

### What You Build
- Contabo VPS setup (Docker + PostgreSQL database).
- Staff login and roles.
- Fleet Master List:
  - Plate numbers
  - Mulkiya expiry alerts
  - Insurance expiry alerts
  - Live status (`AVAILABLE / RENTED`)
- Customer & Rental Agreement Module:
  - Civil ID / Passport capture
  - Exact pickup/return timestamps
  - Odometer readings
  - Security deposits
- Basic Excel Export:
  - Download active rentals.
  - Download deposit balances.

### Go-Live Milestone
Counter staff start issuing digital rental agreements on Contabo while the accountant tracks cash/VAT in Excel.

---

## Phase 2 (Week 2): Oman 5% VAT Invoicing & ROP Traffic Fine Matcher

### Goal
Automate tax-compliant billing and protect against unpaid traffic fines.

### What You Build
- Bilingual (English & Arabic) PDF Tax Invoice & Credit Note generator.
- VATIN.
- Sequential invoice numbers.
- 5% VAT in OMR (`0.000`).
- ROP Fine Matcher:
  - Enter fine timestamp + plate number.
  - Auto-link to the responsible renter.
  - Adjust deposit refund calculation.
- Monthly VAT Report Export:
  - One-click Excel summary of taxable sales.
  - VAT collected.
  - Deposit liabilities.

### Go-Live Milestone
Your rental operation is digitally billed, with tax reporting designed to align with Oman Tax Authority requirements (subject to verification against applicable regulations).

---

## Phase 3 (Week 3): Garage Workshop Job Cards & Spare Parts

### Goal
Bring your mechanics onto the same system and track per-car repair costs.

### What You Build
- Mobile-friendly Mechanic Job Cards for:
  - Walk-in garage customers.
  - Internal rental fleet servicing.
- Spare Parts Inventory:
  - Track stock quantities.
  - Cost price vs. selling price in OMR.
  - Low-stock alerts.
- Automatic Calendar Sync:
  - Putting a rental car into the garage automatically blocks it from new rental bookings until marked `READY`.

### Go-Live Milestone
Garage and rental teams now share one live database—eliminating double-bookings and untracked repair costs.

---

## Phase 4 (Week 4): Online Payments, Photo Walkarounds & Owner Analytics

### Goal
Add convenience features and executive financial dashboards.

### What You Build
- Mobile camera upload for vehicle check-out/check-in damage photos and scanned customer IDs.
- Optional Thawani or PayTabs Oman payment link integration for remote rental deposits and garage invoices.
- Accountant's Executive Dashboard:
  - Net profit per rental vehicle.
  - Rental Revenue minus Garage Parts, Labor, Insurance, and Mulkiya costs.
  - Full Excel export.

### Go-Live Milestone
Owner can review rental operations, outstanding deposits, vehicle profitability, garage expenses, and reports from a single dashboard.

---

# Recommended Next Steps

Before implementation, choose one of these approaches:

1. **Review and refine the exact database fields for Phase 1** (Fleet, Customers, and Rental Contracts) so nothing is missed for your accountant.
2. **Prepare the `.cursorrules` file and Phase 1 prompts** ready to paste into Cursor Pro.

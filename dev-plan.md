SW: https://cursor.com/download

Deploying Software : https://contabo.com/en-us/?gad_source=1&gad_campaignid=23972182501&gbraid=0AAAAAD_Qy-ePfP6AHpeCaoFm80gu8XEPf&gclid=Cj0KCQiA5NXXBhDEARIsABAJhdK4sNcI9Xl5F9CJmKMnbBAg5nr_7nE93mQKEkLzSkjjTd1jLyiu82MaAhMcEALw_wcB

Best Architecture to Build in Cursor Pro (Deployed on Contabo)
To finish both the web frontend and mobile app within 1 month, avoid building two separate codebases. Use a unified JavaScript/TypeScript stack so Cursor Pro can share business logic across everything:
Database & API Backend: PostgreSQL + Prisma (or Supabase Self-Hosted) running in Docker on your Contabo VPS.
Stores all vehicles, Mulkiya/insurance dates, customer Civil IDs/Passports, rental contracts, garage job cards, spare parts inventory, and financial ledgers.
Web Frontend (Office, Counter & Accountant Portal): Next.js (React).
Used by the accountant and counter staff for scheduling rentals, generating bilingual English/Arabic 5% VAT PDF invoices, logging ROP fines, and exporting Excel reports.
Mobile App (Mechanics & Vehicle Handover Staff): Progressive Web App (PWA) built directly inside Next.js, or Expo (React Native)
.
Pro Tip for a 1-Month Timeline: Building your web frontend as a mobile-responsive PWA allows mechanics and handover agents to install it right onto their iOS/Android home screens, take vehicle damage photos with the phone camera, and update job cards—without waiting weeks for Apple App Store or Google Play Store review approvals.
Here is a complete pre-implementation guide designed for a non-technical team and an accountant-owner. It covers Cursor Pro fundamentals, non-technical app design, core workflows, and an incremental, phased rollout plan so you can launch one working use case on Contabo first and expand safely.
Part 1: Cursor Pro Fundamentals (For Non-Coders)
Think of Cursor Pro not as a coding tool, but as a junior software developer sitting beside you. You are the Product Manager and Accountant; Cursor writes the code based on your instructions.
1. The 3 Core Features You Will Use Daily
Agent Mode (Cmd/Ctrl + I): Your main workspace. You type instructions in plain English (e.g., "Create a vehicle check-out form that saves pickup time and odometer reading"), and Cursor creates or edits multiple files automatically.
Chat Mode (Cmd/Ctrl + L): Your Q&A advisor. Use this to ask questions without changing code (e.g., "Explain how this database table calculates 5% VAT" or "Why is this page showing an error?").
Context Tagging (@ symbol): Typing @ lets you point Cursor to specific files or folders (like @schema.prisma or @.cursorrules) so it follows your exact accounting and Oman business rules every time.
2. Golden Rules for Prompting Cursor
Set .cursorrules First: Create a plain text file named .cursorrules in your main project folder before building anything. Put your permanent rules inside: 3-decimal OMR (0.000) precision, 5% Oman VAT, bilingual English/Arabic invoice fields, and no deleting financial records. Cursor reads this automatically on every prompt.
Build One Screen at a Time: Never ask Cursor to "build the entire rental and garage app." Ask it to build one database table, test it, then build one form, and test it.
Save Checkpoints with Git: Before asking Cursor for a big change, save a checkpoint ("commit") in GitHub. If Cursor breaks something, you can click "Undo" back to your last working version in seconds.
Part 2: App Design for Non-Technical Users
Since your staff includes counter agents, mechanics, and an accountant-owner, the interface must be simple, fast, and mistake-proof.
1. Role-Based Screens (Show Only What Each Person Needs)
Rental Counter Agent View: Sees only the Fleet Availability Board, Check-Out / Check-In Forms, and Customer ID Capture. Cannot see company profit margins or edit past invoices.
Garage Mechanic View (Mobile PWA): Opens on a phone or tablet with large touch buttons. Sees only Assigned Job Cards, Parts Used, and Vehicle Status Toggle (In Progress → Ready).
Accountant / Owner View: Full access to 5% VAT Invoices, Security Deposit Ledger, ROP Traffic Fine Deductions, Per-Vehicle Profitability, and One-Click Excel (.xlsx) Exports.
2. UX Design Principles for Daily Operations
Mobile-First PWA (Progressive Web App): Instead of building separate iOS and Android apps (which delays launch by weeks), design the app as a responsive web app that installs directly onto phone home screens. Staff can snap photos of Oman Civil IDs, Mulkiya cards, and car scratches straight from their phone camera.
Smart Validation & Guardrails:
Prevent saving a rental if the customer's driver's license is expired.
Automatically lock a vehicle from rental bookings the moment a mechanic opens a garage job card for that plate number.
Format all money inputs strictly to 3 decimal places (0.000 OMR).
Part 3: Core Workflow Designs
Before writing code, map out how data moves through your business so Cursor builds the exact logic you need.
Workflow A: Rental Check-Out & Check-In (With ROP Fine Protection)
Booking & ID Capture: Agent selects an AVAILABLE car → enters customer details + scans Oman Civil ID / Resident Card / Passport → system verifies license expiry.
Handover (Check-Out): System records exact Date & Timestamp (down to the minute), starting odometer, fuel level, and 4-side walkaround photos. Customer signs digitally on tablet/phone.
Deposit & Advance Payment: System records security deposit hold and rental fee (plus 5% Oman VAT). Vehicle status changes to RENTED.
Return (Check-In): Agent logs exact return timestamp, ending odometer, and return photos → system calculates extra days/km → generates final Oman VAT Tax Invoice.
Post-Rental ROP Fine Check: If a speed/traffic fine appears later on the ROP portal, the accountant enters the fine's timestamp and plate number → the app automatically matches it to the exact renter who had the car at that minute and deducts it from their held deposit.
Workflow B: Garage Workshop Job Card (External & Internal Fleet)
Job Creation: Service advisor enters plate number. System detects whether it is an External Customer Car or an Internal Rental Fleet Car.
Fleet Block (If Internal): If it is a rental car, the system automatically changes its status to IN_GARAGE and blocks it from the rental calendar.
Repair & Parts Logging: Mechanic logs labor hours and selects spare parts from inventory (automatically deducting stock).
Billing vs. Internal Costing:
External Car: Generates a customer 5% VAT Tax Invoice (parts + labor + 5% VAT in OMR).
Internal Rental Car: Logs the parts and labor as a Maintenance Expense tied to that specific vehicle's profit/loss ledger (no external VAT invoice needed), then switches the car back to AVAILABLE.
Part 4: Incremental Delivery Plan (Phased Model)
Do not try to launch everything on Day 1. Use a 4-Phase Incremental Rollout on your Contabo VPS. Each phase gives you a working, live tool within 1 week.
Phase 1 (Week 1): Fleet Master & Car Rental Check-Out/Check-In (MVP)
Goal: Replace paper/Excel rental agreements first.
What You Build:
Contabo VPS setup (Docker + PostgreSQL database) + staff login roles.
Fleet Master List: Plate numbers, Mulkiya expiry alerts, insurance expiry alerts, and live status (AVAILABLE / RENTED).
Customer & Rental Agreement Module: Capture Civil ID/Passport, exact pickup/return timestamps, odometer, and security deposits.
Basic Excel Export: Download active rentals and deposit balances to .xlsx for the owner.
Go-Live Milestone: Counter staff start issuing digital rental agreements on Contabo while the accountant tracks cash/VAT in Excel.
Phase 2 (Week 2): Oman 5% VAT Invoicing & ROP Traffic Fine Matcher
Goal: Automate tax-compliant billing and protect against unpaid traffic fines.
What You Build:
Bilingual (English & Arabic) PDF Tax Invoice & Credit Note generator with your VATIN, sequential invoice numbers, and 5% VAT in OMR (0.000).
ROP Fine Matcher: Enter a fine timestamp + plate number → auto-links to the responsible renter and adjusts their deposit refund.
Monthly VAT Report Export: One-click Excel summary of taxable sales, 5% VAT collected, and deposit liabilities.
Go-Live Milestone: Your rental operation is now 100% digitally billed and Oman Tax Authority compliant.
Phase 3 (Week 3): Garage Workshop Job Cards & Spare Parts
Goal: Bring your mechanics onto the same system and track per-car repair costs.
What You Build:
Mobile-friendly Mechanic Job Cards for both walk-in garage customers and internal rental fleet servicing.
Spare Parts Inventory: Track stock quantities, cost price vs. selling price in OMR, and low-stock alerts.
Automatic Calendar Sync: Putting a rental car into the garage automatically blocks it from new rental bookings until marked READY.
Go-Live Milestone: Garage and rental teams now share one live database—eliminating double-bookings and untracked repair costs.
Phase 4 (Week 4): Online Payments, Photo Walkarounds & Owner Analytics
Goal: Add convenience features and executive financial dashboards.
What You Build:
Mobile camera upload for vehicle check-out/check-in damage photos and scanned customer IDs.
Optional Thawani or PayTabs Oman payment link integration for remote rental deposits and garage invoices.
Accountant's Executive Dashboard: Net profit per rental vehicle (Rental Revenue minus Garage Parts, Labor, Insurance, and Mulkiya costs) with full Excel export.
Before we move to implementation, would you like to:
Review and refine the exact database fields for Phase 1 (Fleet, Customers, and Rental Contracts) so nothing is missed for your accountant?
Or get the .cursorrules file and Phase 1 prompts ready to paste into Cursor Pro?

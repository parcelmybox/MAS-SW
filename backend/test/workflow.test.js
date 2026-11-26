import assert from "node:assert/strict";
import test from "node:test";
import {
  assertTransition,
  normalizePhone,
  validateCancel,
  validateFollowUp,
  validateNewLead,
} from "../src/leadWorkflow.js";

test("normalises an Oman mobile number", () => {
  assert.equal(normalizePhone("91234567").phone, "+96891234567");
  assert.equal(normalizePhone("+968 9234 5678").phone, "+96892345678");
  assert.equal(normalizePhone("0096891234567").phone, "+96891234567");
  assert.equal(normalizePhone("123").ok, false);
});

test("blocks a cancelled lead from becoming business", () => {
  assert.throws(() => assertTransition("CANCELLED", "CONVERTED"), /cannot move/);
  assert.throws(() => assertTransition("CONVERTED", "FOLLOW_UP"), /cannot move/);
  assert.doesNotThrow(() => assertTransition("NEW_ENQUIRY", "CONVERTED"));
  assert.doesNotThrow(() => assertTransition("FOLLOW_UP", "FOLLOW_UP"));
});

test("sale enquiry needs a car or a preference", () => {
  const missing = validateNewLead({ name: "Ahmed", phone: "91234567", area: "CAR_SALE", sale: {} });
  assert.equal(missing.ok, false);
  assert.ok(missing.fields.preference);

  const withBudget = validateNewLead({
    name: "Ahmed",
    phone: "91234567",
    area: "CAR_SALE",
    sale: { budgetOmr: "8500.500" },
  });
  assert.equal(withBudget.ok, true);
  assert.equal(withBudget.lead.sale.budgetOmr, 8500.5);
  assert.equal(withBudget.lead.city, "Muscat");
  assert.equal(withBudget.lead.currency, "OMR");
});

test("rental enquiry keeps start date and duration", () => {
  const parsed = validateNewLead({
    name: "Fatma",
    phone: "92345678",
    area: "CAR_RENTAL",
    rental: { category: "SUV", startDate: "2026-12-01", durationDays: 7 },
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.lead.rental.durationDays, 7);
  assert.equal(parsed.lead.rental.startDate, "2026-12-01");
  assert.equal(parsed.lead.rental.pickupArea, "Muscat");

  const bad = validateNewLead({
    name: "Fatma",
    phone: "92345678",
    area: "CAR_RENTAL",
    rental: { category: "SUV", startDate: "2026-12-01", durationDays: 0 },
  });
  assert.equal(bad.ok, false);
});

test("service enquiry needs a car and a workshop date", () => {
  const parsed = validateNewLead({
    name: "Said",
    phone: "93456789",
    area: "CAR_SERVICE",
    service: { plateNumber: "M 44120", serviceType: "Periodic service", scheduledDate: "2026-12-02" },
  });
  assert.equal(parsed.ok, true);
  const missingCar = validateNewLead({
    name: "Said",
    phone: "93456789",
    area: "CAR_SERVICE",
    service: { serviceType: "Oil change", scheduledDate: "2026-12-02" },
  });
  assert.equal(missingCar.ok, false);
});

test("follow-up and cancel need a date or a reason", () => {
  assert.equal(validateFollowUp({ date: "2020-01-01" }).ok, false);
  assert.equal(validateFollowUp({ date: "2099-01-15" }).ok, true);
  assert.equal(validateCancel({ reason: "   " }).ok, false);
  assert.equal(validateCancel({ reason: "Went to another garage" }).ok, true);
});

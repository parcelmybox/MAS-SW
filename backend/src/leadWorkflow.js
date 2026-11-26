export const AREAS = ["CAR_SALE", "CAR_RENTAL", "CAR_SERVICE"];
export const STATUSES = ["NEW_ENQUIRY", "FOLLOW_UP", "CONVERTED", "CANCELLED"];

export const AREA_LABELS = {
  CAR_SALE: "Car sale",
  CAR_RENTAL: "Car rental",
  CAR_SERVICE: "Car repair / service",
};

export const STATUS_LABELS = {
  NEW_ENQUIRY: "New enquiry",
  FOLLOW_UP: "Follow-up",
  CONVERTED: "Converted to business",
  CANCELLED: "Cancelled",
};

export const SERVICE_TYPES = [
  "Periodic service",
  "Oil change",
  "Brake repair",
  "AC repair",
  "Body work",
  "Diagnosis",
  "Mulkiya preparation",
];

export const RENTAL_CATEGORIES = ["Sedan", "SUV", "Pickup", "Luxury"];

const NEXT = {
  NEW_ENQUIRY: new Set(["FOLLOW_UP", "CONVERTED", "CANCELLED"]),
  FOLLOW_UP: new Set(["FOLLOW_UP", "CONVERTED", "CANCELLED"]),
  CONVERTED: new Set(),
  CANCELLED: new Set(),
};

export function todayInMuscat() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Muscat",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function assertTransition(from, to) {
  if (!NEXT[from] || !NEXT[from].has(to)) {
    const error = new Error(
      `${STATUS_LABELS[from] || from} cannot move to ${STATUS_LABELS[to] || to}.`
    );
    error.status = 409;
    throw error;
  }
}

export function normalizePhone(input) {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("00968")) digits = digits.slice(5);
  else if (digits.startsWith("968") && digits.length === 11) digits = digits.slice(3);
  if (!/^\d{8}$/.test(digits)) {
    return { ok: false, message: "Enter an Oman mobile number (8 digits)." };
  }
  return { ok: true, phone: `+968${digits}` };
}

export function formatPhone(stored) {
  const digits = String(stored || "").replace(/\D/g, "").replace(/^968/, "");
  if (digits.length !== 8) return stored || "";
  return `+968 ${digits.slice(0, 4)} ${digits.slice(4)}`;
}

function clean(value) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function day(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const [year, month, date] = text.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, date));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== date
  ) {
    return null;
  }
  return text;
}

function fail(fields) {
  return { ok: false, message: Object.values(fields)[0], fields };
}

export function validateNewLead(body) {
  const fields = {};
  const name = clean(body.name);
  if (!name || name.length < 2) fields.name = "Enter the customer's name.";

  const phoneResult = normalizePhone(body.phone);
  if (!phoneResult.ok) fields.phone = phoneResult.message;

  const area = body.area;
  if (!AREAS.includes(area)) fields.area = "Choose sale, rental, or repair / service.";
  if (Object.keys(fields).length) return fail(fields);

  const notes = clean(body.notes);
  const lead = {
    name,
    phone: phoneResult.phone,
    area,
    notes: notes ? notes.slice(0, 2000) : null,
    country: "Oman",
    city: "Muscat",
    currency: "OMR",
  };

  if (area === "CAR_SALE") lead.sale = validateSale(body.sale || {}, fields);
  if (area === "CAR_RENTAL") lead.rental = validateRental(body.rental || {}, fields);
  if (area === "CAR_SERVICE") lead.service = validateService(body.service || {}, fields);
  if (Object.keys(fields).length) return fail(fields);
  return { ok: true, lead };
}

function validateSale(sale, fields) {
  const vehicleId = sale.vehicleId ? Number(sale.vehicleId) : null;
  const preferredMake = clean(sale.preferredMake);
  const preferredModel = clean(sale.preferredModel);
  const yearFrom = sale.yearFrom ? Number(sale.yearFrom) : null;
  const yearTo = sale.yearTo ? Number(sale.yearTo) : null;
  const budgetRaw = clean(sale.budgetOmr);
  const budgetOmr = budgetRaw == null ? null : Number(budgetRaw);

  if (!vehicleId && !preferredMake && !preferredModel && budgetOmr == null) {
    fields.preference = "Choose a car, or enter the make, model, or budget.";
  }
  if (vehicleId && !Number.isInteger(vehicleId)) fields.vehicleId = "Choose a car from the list.";
  if (budgetOmr != null && (!Number.isFinite(budgetOmr) || budgetOmr < 0)) {
    fields.budgetOmr = "Budget must be a positive OMR amount.";
  }
  for (const [key, year] of [["yearFrom", yearFrom], ["yearTo", yearTo]]) {
    if (year != null && (!Number.isInteger(year) || year < 1990 || year > 2035)) {
      fields[key] = "Enter a model year between 1990 and 2035.";
    }
  }
  if (yearFrom && yearTo && yearFrom > yearTo) fields.yearTo = "Year to is earlier than year from.";

  return { vehicleId, preferredMake, preferredModel, yearFrom, yearTo, budgetOmr };
}

function validateRental(rental, fields) {
  const vehicleId = rental.vehicleId ? Number(rental.vehicleId) : null;
  const preferredMake = clean(rental.preferredMake);
  const preferredModel = clean(rental.preferredModel);
  const category = RENTAL_CATEGORIES.includes(rental.category) ? rental.category : clean(rental.category);
  const startDate = day(rental.startDate);
  const durationDays = Number(rental.durationDays);

  if (!vehicleId && !preferredMake && !preferredModel && !category) {
    fields.preference = "Choose a car or describe what they want to rent.";
  }
  if (!startDate) fields.startDate = "Enter the rental start date.";
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) {
    fields.durationDays = "Duration must be between 1 and 365 days.";
  }
  if (category && !RENTAL_CATEGORIES.includes(category)) {
    fields.category = "Choose Sedan, SUV, Pickup, or Luxury.";
  }

  return {
    vehicleId,
    preferredMake,
    preferredModel,
    category: RENTAL_CATEGORIES.includes(category) ? category : null,
    startDate,
    durationDays,
    pickupArea: "Muscat",
  };
}

function validateService(service, fields) {
  const vehicleId = service.vehicleId ? Number(service.vehicleId) : null;
  const plateNumber = clean(service.plateNumber);
  const make = clean(service.make);
  const model = clean(service.model);
  const serviceType = clean(service.serviceType);
  const scheduledDate = day(service.scheduledDate);
  const complaint = clean(service.complaint);

  if (!vehicleId && !plateNumber) {
    fields.plateNumber = "Enter the car plate or choose a fleet car.";
  }
  if (!serviceType) fields.serviceType = "Choose the service they are asking about.";
  if (serviceType && !SERVICE_TYPES.includes(serviceType)) {
    fields.serviceType = "Choose a service from the list.";
  }
  if (!scheduledDate) fields.scheduledDate = "Enter the date they want the car in the workshop.";

  return {
    vehicleId,
    plateNumber,
    make,
    model,
    serviceType,
    scheduledDate,
    complaint: complaint ? complaint.slice(0, 2000) : null,
  };
}

export function validateFollowUp(body) {
  const followUpDate = day(body.date || body.followUpDate);
  if (!followUpDate) {
    return fail({ followUpDate: "Enter the follow-up date." });
  }
  const today = todayInMuscat();
  if (followUpDate < today) {
    return fail({ followUpDate: "Follow-up date must be today or later." });
  }
  const note = clean(body.note);
  return { ok: true, followUpDate, note: note ? note.slice(0, 2000) : null };
}

export function validateCancel(body) {
  const reason = clean(body.reason);
  if (!reason) return fail({ reason: "Enter why this enquiry is cancelled." });
  return { ok: true, reason: reason.slice(0, 2000) };
}

export function businessPrefix(area) {
  if (area === "CAR_SALE") return { docType: "SALE", prefix: "MAS-SL" };
  if (area === "CAR_RENTAL") return { docType: "RENTAL", prefix: "MAS-RN" };
  return { docType: "SERVICE", prefix: "MAS-SV" };
}
